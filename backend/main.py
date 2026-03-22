"""
JanVaani — FastAPI Backend
Speech-to-Speech AI assistant for inclusive digital transformation.

Endpoints:
    POST /api/stt          — Speech-to-Text (audio -> text via Groq)
    POST /api/chat         — LLM Chat (text -> text)
    POST /api/tts          — Text-to-Speech (text -> audio)
    POST /api/conversation — Full pipeline (audio -> text -> LLM -> audio)
    GET  /api/health       — Health check
    GET  /api/config       — Frontend config (available services)
"""

from __future__ import annotations

import asyncio
import base64
import logging
import re
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.config import get_settings
from backend.services.stt import get_stt_service
from backend.services.llm import get_llm_service
from backend.services.tts import get_tts_service
from backend.services.guide_generator import get_guide_service
from backend.services.youtube_search import get_youtube_service
from backend.services.web_scraper import get_scraper_service
from backend.data.government_services import search_services as search_service_records

# ─── Logging ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("janvaani.api")


# ─── Lifespan ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown logic."""
    logger.info("🚀 JanVaani Backend starting...")
    # Pre-initialize services
    get_stt_service()
    get_llm_service()
    get_tts_service()
    get_guide_service()
    get_youtube_service()
    get_scraper_service()
    logger.info("✅ All services initialized")
    yield
    # Cleanup
    tts = get_tts_service()
    tts.close()
    youtube = get_youtube_service()
    await youtube.close()
    scraper = get_scraper_service()
    await scraper.close()
    logger.info("👋 JanVaani Backend stopped")


# ─── FastAPI App ──────────────────────────────────────────────────────
app = FastAPI(
    title="JanVaani API",
    description="Speech-to-Speech AI assistant for inclusive digital transformation in India",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "https://*.github.io",
        "https://*.vercel.app",
        "https://*.netlify.app",
        "https://*.onrender.com",
    ],
    allow_origin_regex=r"https://.*\.(github\.io|vercel\.app|netlify\.app|onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ─────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    conversation_history: list[dict] | None = None
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    provider: str | None
    model: str | None
    session_id: str
    success: bool
    error: str | None = None


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


class TTSResponse(BaseModel):
    audio_base64: str
    content_type: str
    provider: str | None
    success: bool
    error: str | None = None


class ConversationRequest(BaseModel):
    language: str = "en"
    conversation_history: list[dict] | None = None
    session_id: str | None = None


class ConversationResponse(BaseModel):
    # STT result
    user_text: str
    stt_success: bool
    # LLM result
    reply_text: str
    llm_provider: str | None
    llm_success: bool
    # TTS result
    audio_base64: str
    audio_content_type: str
    tts_provider: str | None
    tts_success: bool
    # Meta
    session_id: str
    total_time_ms: int
    error: str | None = None


# ─── In-memory session store (use Redis/DB in production) ─────────────
_sessions: dict[str, list[dict]] = {}

MAX_SESSIONS = 1000
MAX_HISTORY_PER_SESSION = 50


def strip_action_marker(text: str) -> str:
    """Remove hidden machine action marker and accidental tag artifacts from assistant text."""
    if not text:
        return ""

    marker_regex = re.compile(r"<janvaani_action>[\s\S]*?</janvaani_action>", re.IGNORECASE)
    cleaned = marker_regex.sub("", text)

    # Defensive cleanup for malformed/truncated tags occasionally emitted by models.
    cleaned = re.sub(r"</?janvaani_action[^>]*>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"</?janva[^>]*>", "", cleaned, flags=re.IGNORECASE)

    return cleaned.strip()


def get_or_create_session(session_id: str | None) -> tuple[str, list[dict]]:
    """Get existing session or create new one."""
    if session_id and session_id in _sessions:
        return session_id, _sessions[session_id]

    sid = session_id or str(uuid.uuid4())

    # Evict oldest sessions if too many
    if len(_sessions) >= MAX_SESSIONS:
        oldest_key = next(iter(_sessions))
        del _sessions[oldest_key]

    _sessions[sid] = []
    return sid, _sessions[sid]


def append_to_session(session_id: str, role: str, content: str):
    """Append message to session history."""
    if session_id not in _sessions:
        _sessions[session_id] = []
    history = _sessions[session_id]
    history.append({"role": role, "content": content})
    # Keep history bounded
    if len(history) > MAX_HISTORY_PER_SESSION:
        _sessions[session_id] = history[-MAX_HISTORY_PER_SESSION:]


async def build_official_context(user_text: str, language: str = "en") -> str:
    """Collect latest official context for the query from curated services + scraper."""
    try:
        service_candidates = search_service_records(user_text, language)
        if not service_candidates:
            return ""

        service = service_candidates[0]
        scraper = get_scraper_service()
        scraped = await scraper.search_service_page(service.name, service.department)

        context_parts = [
            f"Service: {service.name}",
            f"Department: {service.department}",
            f"Official URL: {service.official_url}",
            f"Known processing time: {service.processing_time}",
            f"Known fees: {service.fees}",
            f"Known required documents: {', '.join(service.required_documents[:8])}",
            "Known official steps:",
        ]
        for idx, step in enumerate(service.steps[:8], start=1):
            context_parts.append(f"{idx}. {step}")

        if scraped and scraped.success:
            context_parts.append(f"Latest scraped page title: {scraped.title}")
            context_parts.append(f"Latest scraped URL: {scraped.url}")
            if scraped.content:
                context_parts.append("Latest scraped content snippet:")
                context_parts.append(scraped.content[:2200])
            if scraped.links:
                context_parts.append("Related official links:")
                for link in scraped.links[:6]:
                    context_parts.append(f"- {link.get('text', '')}: {link.get('url', '')}")

        return "\n".join(context_parts)[:4200]
    except Exception as e:
        logger.warning("⚠️ Official context build failed: %s", e)
        return ""


# ─── Endpoints ────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    stt = get_stt_service()
    llm = get_llm_service()
    tts = get_tts_service()

    return {
        "status": "healthy",
        "services": {
            "stt": {"available": stt.is_available, "provider": "Groq Whisper API"},
            "llm": {"available": llm.is_available, "provider": "Groq/Cerebras/NVIDIA"},
            "tts": {"available": tts.is_available, "provider": "Azure/Sarvam/Bhashini API"},
        },
        "version": "1.0.0",
    }


@app.get("/api/config")
async def get_config():
    """Return frontend-safe configuration."""
    stt = get_stt_service()
    llm = get_llm_service()
    tts = get_tts_service()
    s = get_settings()

    return {
        "services_available": {
            "stt": stt.is_available,
            "llm": llm.is_available,
            "tts": tts.is_available,
        },
        "supported_languages": list(s.supported_languages.keys()),
        "features": {
            "speech_to_text": stt.is_available,
            "text_chat": llm.is_available,
            "text_to_speech": tts.is_available,
            "full_pipeline": stt.is_available and llm.is_available and tts.is_available,
        },
    }


@app.post("/api/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
):
    """
    Convert speech audio to text using Groq Whisper API.
    Accepts: webm, wav, mp3, mp4, m4a, ogg, flac
    """
    stt = get_stt_service()
    if not stt.is_available:
        raise HTTPException(503, "STT service not configured")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty audio file")

    if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(413, "Audio file too large (max 25MB)")

    result = await stt.transcribe(
        audio_bytes=audio_bytes,
        language=language,
        filename=audio.filename or "audio.webm",
    )

    return JSONResponse(content=result)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Send text to LLM and get a response.
    Maintains conversation history via session_id.
    """
    llm = get_llm_service()
    if not llm.is_available:
        raise HTTPException(503, "LLM service not configured")

    session_id, history = get_or_create_session(req.session_id)

    # Use provided history or session history
    conv_history = req.conversation_history if req.conversation_history else history

    result = await llm.chat(
        user_message=req.message,
        language=req.language,
        conversation_history=conv_history,
        official_context=await build_official_context(req.message, req.language),
    )

    if result["success"]:
        assistant_clean = strip_action_marker(result["reply"])
        append_to_session(session_id, "user", req.message)
        append_to_session(session_id, "assistant", assistant_clean)

    return ChatResponse(
        reply=result["reply"],
        provider=result.get("provider"),
        model=result.get("model"),
        session_id=session_id,
        success=result["success"],
        error=result.get("error"),
    )


@app.post("/api/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    """
    Convert text to speech audio.
    Returns base64-encoded audio.
    """
    tts = get_tts_service()
    settings = get_settings()

    if len(req.text) > 2000:
        raise HTTPException(400, "Text too long (max 2000 chars)")

    try:
        result = await asyncio.wait_for(
            tts.synthesize(text=req.text, language=req.language),
            timeout=settings.tts_generation_timeout_seconds,
        )
    except asyncio.TimeoutError:
        logger.warning("⏱️ /api/tts timeout after %.1fs", settings.tts_generation_timeout_seconds)
        result = {
            "audio_base64": "",
            "content_type": "audio/wav",
            "provider": "Parler TTS (timeout)",
            "success": False,
            "error": "TTS timeout",
        }

    return TTSResponse(
        audio_base64=result["audio_base64"],
        content_type=result["content_type"],
        provider=result.get("provider"),
        success=result["success"],
        error=result.get("error"),
    )


@app.post("/api/conversation", response_model=ConversationResponse)
async def full_conversation(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    session_id: str = Form(default=""),
):
    """
    Full speech-to-speech pipeline:
    1. STT: Audio -> Text (Groq Whisper API)
    2. LLM: Text → Reply (Groq/Cerebras/NVIDIA)
    3. TTS: Reply -> Audio (Sarvam/Bhashini API)

    Returns everything: transcribed text, LLM reply, and audio response.
    """
    start_time = time.time()

    stt = get_stt_service()
    llm = get_llm_service()
    tts = get_tts_service()
    settings = get_settings()

    # Validate
    if not stt.is_available:
        raise HTTPException(503, "STT service not available")
    if not llm.is_available:
        raise HTTPException(503, "LLM service not available")

    sid, history = get_or_create_session(session_id or None)

    # Read audio
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty audio file")

    # ── Step 1: STT ──────────────────────────────────────────────
    stt_result = await stt.transcribe(
        audio_bytes=audio_bytes,
        language=language,
        filename=audio.filename or "audio.webm",
    )

    if not stt_result["success"] or not stt_result["text"]:
        elapsed = int((time.time() - start_time) * 1000)
        return ConversationResponse(
            user_text="",
            stt_success=False,
            reply_text="",
            llm_provider=None,
            llm_success=False,
            audio_base64="",
            audio_content_type="audio/wav",
            tts_provider=None,
            tts_success=False,
            session_id=sid,
            total_time_ms=elapsed,
            error=stt_result.get("error", "Could not transcribe audio"),
        )

    user_text = stt_result["text"]

    # ── Step 2: LLM ──────────────────────────────────────────────
    llm_result = await llm.chat(
        user_message=user_text,
        language=language,
        conversation_history=history,
        official_context=await build_official_context(user_text, language),
    )

    if not llm_result["success"]:
        elapsed = int((time.time() - start_time) * 1000)
        return ConversationResponse(
            user_text=user_text,
            stt_success=True,
            reply_text="",
            llm_provider=None,
            llm_success=False,
            audio_base64="",
            audio_content_type="audio/wav",
            tts_provider=None,
            tts_success=False,
            session_id=sid,
            total_time_ms=elapsed,
            error=llm_result.get("error", "LLM failed to respond"),
        )

    raw_reply_text = llm_result["reply"]
    reply_text = strip_action_marker(raw_reply_text)

    # Update session
    append_to_session(sid, "user", user_text)
    append_to_session(sid, "assistant", reply_text)

    # ── Step 3: TTS ──────────────────────────────────────────────
    try:
        tts_result = await asyncio.wait_for(
            tts.synthesize(text=reply_text, language=language),
            timeout=settings.tts_generation_timeout_seconds,
        )
    except asyncio.TimeoutError:
        logger.warning("⏱️ TTS timeout after %.1fs", settings.tts_generation_timeout_seconds)
        tts_result = {
            "audio_base64": "",
            "content_type": "audio/wav",
            "provider": "Parler TTS (timeout)",
            "success": False,
            "error": "TTS timeout",
        }

    elapsed = int((time.time() - start_time) * 1000)

    logger.info(
        "🔄 Full pipeline: lang=%s, time=%dms, STT=✅, LLM=%s, TTS=%s",
        language, elapsed, llm_result.get("provider"), tts_result.get("provider"),
    )

    return ConversationResponse(
        user_text=user_text,
        stt_success=True,
        reply_text=reply_text,
        llm_provider=llm_result.get("provider"),
        llm_success=True,
        audio_base64=tts_result.get("audio_base64", ""),
        audio_content_type=tts_result.get("content_type", "audio/wav"),
        tts_provider=tts_result.get("provider"),
        tts_success=tts_result["success"],
        session_id=sid,
        total_time_ms=elapsed,
    )


@app.post("/api/text-conversation")
async def text_conversation(req: ChatRequest):
    """
    Text-based conversation with TTS response.
    For users who type instead of speak.
    Pipeline: Text → LLM → TTS → Audio
    """
    start_time = time.time()

    llm = get_llm_service()
    tts = get_tts_service()
    settings = get_settings()

    if not llm.is_available:
        raise HTTPException(503, "LLM service not available")

    sid, history = get_or_create_session(req.session_id)
    conv_history = req.conversation_history if req.conversation_history else history

    # LLM
    llm_result = await llm.chat(
        user_message=req.message,
        language=req.language,
        conversation_history=conv_history,
        official_context=await build_official_context(req.message, req.language),
    )

    if llm_result["success"]:
        assistant_clean = strip_action_marker(llm_result["reply"])
        append_to_session(sid, "user", req.message)
        append_to_session(sid, "assistant", assistant_clean)

    # TTS
    tts_result = {"audio_base64": "", "content_type": "audio/wav", "provider": None, "success": False}
    if llm_result["success"]:
        cleaned_reply = strip_action_marker(llm_result["reply"])
        try:
            tts_result = await asyncio.wait_for(
                tts.synthesize(text=cleaned_reply, language=req.language),
                timeout=settings.tts_generation_timeout_seconds,
            )
        except asyncio.TimeoutError:
            logger.warning("⏱️ TTS timeout after %.1fs", settings.tts_generation_timeout_seconds)
            tts_result = {
                "audio_base64": "",
                "content_type": "audio/wav",
                "provider": "Parler TTS (timeout)",
                "success": False,
                "error": "TTS timeout",
            }

    elapsed = int((time.time() - start_time) * 1000)

    return {
        "reply_text": strip_action_marker(llm_result.get("reply", "")),
        "llm_provider": llm_result.get("provider"),
        "llm_success": llm_result["success"],
        "audio_base64": tts_result.get("audio_base64", ""),
        "audio_content_type": tts_result.get("content_type", "audio/wav"),
        "tts_provider": tts_result.get("provider"),
        "tts_success": tts_result["success"],
        "session_id": sid,
        "total_time_ms": elapsed,
        "error": llm_result.get("error"),
    }


# ─── New Guide & YouTube Endpoints ────────────────────────────────────

class GuideRequest(BaseModel):
    service_id: str
    language: str = "en"
    include_web_content: bool = True


class GuideResponse(BaseModel):
    guide: dict | None
    success: bool
    error: str | None = None


class YouTubeSearchRequest(BaseModel):
    query: str
    language: str = "en"
    max_results: int = 18


class YouTubeSearchResponse(BaseModel):
    videos: list[dict]
    success: bool
    search_url: str
    error: str | None = None


class ServicesListResponse(BaseModel):
    services: list[dict]
    success: bool


class WebScrapeRequest(BaseModel):
    url: str


class WebScrapeResponse(BaseModel):
    content: dict | None
    success: bool
    error: str | None = None


@app.get("/api/services")
async def list_services() -> ServicesListResponse:
    """List all available government services."""
    guide_svc = get_guide_service()
    services = guide_svc.list_all_services()
    return ServicesListResponse(services=services, success=True)


@app.post("/api/guide", response_model=GuideResponse)
async def get_guide(req: GuideRequest) -> GuideResponse:
    """
    Get a comprehensive step-by-step guide for a government service.
    Includes: steps, required documents, eligibility, fees, processing time.
    """
    try:
        guide_svc = get_guide_service()
        guide = await guide_svc.generate_guide(
            service_id=req.service_id,
            language=req.language,
            include_web_content=req.include_web_content,
        )

        if not guide:
            return GuideResponse(
                guide=None,
                success=False,
                error=f"Service not found: {req.service_id}",
            )

        # Convert to dict for JSON response
        guide_dict = {
            "service_id": guide.service_id,
            "service_name": guide.service_name,
            "service_name_hi": guide.service_name_hi,
            "service_name_ta": guide.service_name_ta,
            "category": guide.category,
            "official_url": guide.official_url,
            "department": guide.department,
            "steps": [
                {
                    "step_number": s.step_number,
                    "title": s.title,
                    "title_hi": s.title_hi,
                    "title_ta": s.title_ta,
                    "description": s.description,
                    "description_hi": s.description_hi,
                    "description_ta": s.description_ta,
                }
                for s in guide.steps
            ],
            "required_documents": guide.required_documents,
            "required_documents_hi": guide.required_documents_hi,
            "required_documents_ta": guide.required_documents_ta,
            "eligibility": guide.eligibility,
            "eligibility_hi": guide.eligibility_hi,
            "eligibility_ta": guide.eligibility_ta,
            "processing_time": guide.processing_time,
            "processing_time_hi": guide.processing_time_hi,
            "processing_time_ta": guide.processing_time_ta,
            "fees": guide.fees,
            "fees_hi": guide.fees_hi,
            "fees_ta": guide.fees_ta,
            "helpline": guide.helpline,
            "email": guide.email,
            "contact_note": getattr(guide, "contact_note", ""),
            "contact_note_hi": getattr(guide, "contact_note_hi", ""),
            "contact_note_ta": getattr(guide, "contact_note_ta", ""),
            "interactive_steps": guide.interactive_steps,
            "source_url": guide.source_url,
            "youtube_keywords": guide.youtube_keywords,
        }

        return GuideResponse(guide=guide_dict, success=True, error=None)

    except Exception as e:
        logger.error("Error generating guide: %s", e, exc_info=True)
        return GuideResponse(guide=None, success=False, error=str(e))


@app.post("/api/youtube-search", response_model=YouTubeSearchResponse)
async def search_youtube(req: YouTubeSearchRequest) -> YouTubeSearchResponse:
    """
    Search YouTube for tutorial videos related to a government service.
    Returns videos in the user's preferred language.
    """
    try:
        youtube_svc = get_youtube_service()
        videos = await youtube_svc.search(
            query=req.query,
            language=req.language,
            max_results=req.max_results,
        )

        videos_dict = [
            {
                "title": v.title,
                "url": v.url,
                "channel": v.channel,
                "duration": v.duration,
                "views": v.views,
                "thumbnail": v.thumbnail,
                "published": v.published,
            }
            for v in videos
        ]

        search_url = youtube_svc.get_search_url(req.query, req.language)

        return YouTubeSearchResponse(
            videos=videos_dict,
            success=True,
            search_url=search_url,
            error=None,
        )

    except Exception as e:
        logger.error("Error searching YouTube: %s", e, exc_info=True)
        return YouTubeSearchResponse(
            videos=[],
            success=False,
            search_url="",
            error=str(e),
        )


@app.post("/api/scrape", response_model=WebScrapeResponse)
async def scrape_website(req: WebScrapeRequest) -> WebScrapeResponse:
    """
    Scrape content from an official Indian government website.
    Only .gov.in domains are allowed for security.
    """
    try:
        scraper_svc = get_scraper_service()
        result = await scraper_svc.scrape_url(req.url)

        if not result.success:
            return WebScrapeResponse(
                content=None,
                success=False,
                error=result.error,
            )

        content_dict = {
            "url": result.url,
            "title": result.title,
            "content": result.content,
            "links": result.links,
            "domain": result.domain,
        }

        return WebScrapeResponse(content=content_dict, success=True, error=None)

    except Exception as e:
        logger.error("Error scraping website: %s", e, exc_info=True)
        return WebScrapeResponse(content=None, success=False, error=str(e))


@app.get("/api/services/search")
async def search_services(q: str, lang: str = "en") -> ServicesListResponse:
    """Search for government services by name or category."""
    from backend.data.government_services import search_services

    services = search_services(q, lang)
    services_list = [
        {
            "id": s.id,
            "name": s.name,
            "name_hi": s.name_hi,
            "name_ta": s.name_ta,
            "category": s.category,
            "official_url": s.official_url,
        }
        for s in services
    ]
    return ServicesListResponse(services=services_list, success=True)


# ─── Run ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level=settings.log_level,
    )
