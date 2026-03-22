"""
JanVaani — LLM Service
3-Provider rotation with automatic failover:
    1. Groq (Primary) — openai/gpt-oss-120b
  2. Cerebras (Backup) — llama-3.3-70b
  3. NVIDIA NIM (Backup) — meta/llama-3.1-70b-instruct
All are OpenAI-compatible APIs — just swap base URL.
"""

from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass, field

from openai import OpenAI, APIError, RateLimitError

from backend.config import get_settings

logger = logging.getLogger("janvaani.llm")

# ─── System Prompt ─────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are JanVaani (जनवाणी), an AI voice assistant built by Team JanVaani for Digital India.

YOUR MISSION: Help illiterate and semi-literate Indian citizens access government digital services through simple conversation.

CRITICAL RULES:
1. ALWAYS respond in the SAME language the user speaks. If they speak Hindi, reply in Hindi only. Tamil → Tamil only. English → English only.
    Do not mix languages in the same reply. For English replies, use only English words and grammar.
2. Keep responses SHORT (2-3 sentences max) — this will be spoken aloud via TTS.
3. Use SIMPLE, everyday language — no jargon, no English technical terms when speaking Hindi/Tamil.
4. Be warm, patient, and respectful — address users as "aap/आप" (Hindi) or respectful forms.
5. This assistant is ADVISORY ONLY. Do NOT act as if you are submitting applications.
6. Do NOT ask for personal identifiers (DOB, Aadhaar number, PAN number, bank details, OTP, address) unless the official process explicitly requires category clarification.
7. If a follow-up question is needed, ask ONLY one safe clarification at a time, such as: application type/category, new vs update, online vs offline availability.
8. Always finish the full thought before appending the machine action marker. Never end mid-sentence or leave the answer incomplete.

SERVICES YOU CAN HELP WITH:
- Ration Card (राशन कार्ड / ரேஷன் கார்டு): Apply new, check status, add/remove members, download
- Aadhaar (आधार / ஆதார்): Update address/mobile/name, download e-Aadhaar, link with bank
- PM Kisan (पीएम किसान): Registration, check payment status, eKYC
- Pension Schemes: PM Vaya Vandana, National Pension, Old Age Pension — check eligibility, apply
- Birth/Death Certificate: Apply, download, correction
- Caste/Income/Domicile Certificate: Apply online, check status, download
- Voter ID (EPIC): New registration, correction, download
- Driving License / Vehicle Registration (mParivahan)
- Jan Dhan Yojana: Open account, check balance
- MGNREGA Job Card: Apply, check work history, payment status
- Ayushman Bharat (PMJAY): Check eligibility, find hospital, get card
- Scholarship Portals: Check eligibility, apply
- Electricity/Water Bill: Check & pay
- Land Records (Bhulekh): Check ownership, download records

CONVERSATION FLOW:
1. Greet warmly, ask what service they need
2. Explain official online availability first (if available, say so clearly)
3. Then provide step-by-step guidance from official context
4. Mention office/manual route only when online option is unavailable or fails
5. Ask category-only clarifications when necessary (for example: new PAN vs correction)

MACHINE ACTION MARKER (MANDATORY FOR APP UI):
- At the very end of EVERY response, append exactly one tag in this format:
    <janvaani_action>{"ready_for_guidance":false,"service_id":"unknown"}</janvaani_action>
- Set "ready_for_guidance" to true when service intent is clear and guidance can be shown.
- When "ready_for_guidance" is true, set "service_id" to one of:
    aadhaar, ration_card, pan_card, voter_id, passport, pm_kisan.
- If service is unclear, keep "service_id" as "unknown" and "ready_for_guidance" as false.
- Never explain this tag to the user. Keep it only as a hidden machine marker.

IMPORTANT: Do not claim you will submit forms on behalf of users. You provide guidance and official steps only.

GROUNDING AND SAFETY (MANDATORY):
1. Use ONLY verified official context when it is provided by the system.
2. Do NOT invent portal names, URLs, fees, or document lists.
3. If information is missing or uncertain, clearly say it is not confirmed and ask one clarifying question.
4. Prefer "latest official guidance" wording and mention uncertainty rather than guessing.

You are their bridge to digital India. Be their voice. Be JanVaani. 🇮🇳"""


@dataclass
class LLMProvider:
    """Represents a single LLM provider."""
    name: str
    base_url: str
    api_key: str
    model: str
    client: OpenAI | None = field(default=None, init=False, repr=False)
    request_timeout_seconds: float = field(default=20.0)
    max_retries: int = field(default=1)

    def __post_init__(self):
        if self.api_key:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=self.request_timeout_seconds,
                max_retries=self.max_retries,
            )
            logger.info("✅ LLM Provider ready: %s (model=%s)", self.name, self.model)
        else:
            logger.warning("⚠️ LLM Provider %s — no API key", self.name)

    @property
    def is_available(self) -> bool:
        return self.client is not None


class LLMService:
    """Multi-provider LLM service with automatic failover."""

    def __init__(self):
        settings = get_settings()

        # Initialize providers in priority order
        self._providers: list[LLMProvider] = []
        self._request_timeout_seconds = settings.llm_request_timeout_seconds
        self._max_retries = settings.llm_max_retries

        # Provider 1: Groq (fastest inference)
        self._providers.append(LLMProvider(
            name="Groq",
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.groq_api_key,
            model=settings.groq_llm_model,
            request_timeout_seconds=self._request_timeout_seconds,
            max_retries=self._max_retries,
        ))

        # Provider 2: Cerebras (1M tokens/day free)
        self._providers.append(LLMProvider(
            name="Cerebras",
            base_url="https://api.cerebras.ai/v1",
            api_key=settings.cerebras_api_key,
            model=settings.cerebras_llm_model,
            request_timeout_seconds=self._request_timeout_seconds,
            max_retries=self._max_retries,
        ))

        # Provider 3: NVIDIA NIM
        self._providers.append(LLMProvider(
            name="NVIDIA",
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=settings.nvidia_api_key,
            model=settings.nvidia_llm_model,
            request_timeout_seconds=self._request_timeout_seconds,
            max_retries=self._max_retries,
        ))

        available = [p.name for p in self._providers if p.is_available]
        logger.info("🧠 LLM Service: %d/%d providers available: %s",
                     len(available), len(self._providers), ", ".join(available) or "NONE")

    @property
    def is_available(self) -> bool:
        return any(p.is_available for p in self._providers)

    async def chat(
        self,
        user_message: str,
        language: str = "en",
        conversation_history: list[dict] | None = None,
        official_context: str | None = None,
    ) -> dict:
        """
        Generate a response using LLM with automatic failover.

        Args:
            user_message: User's text (from STT or typed)
            language: Language code for context
            conversation_history: Previous messages [{"role": "user/assistant", "content": "..."}]

        Returns:
            dict with keys: reply, provider, success, error
        """
        # Build messages array
        lang_names = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu",
                      "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam"}
        lang_name = lang_names.get(language, "English")

        system_content = SYSTEM_PROMPT + f"\n\nCurrent user language: {lang_name} ({language}). RESPOND ONLY IN {lang_name}. Do not mix scripts or insert explanations in other languages."
        if official_context:
            system_content += (
                "\n\nVERIFIED OFFICIAL CONTEXT (USE THIS AS PRIMARY SOURCE):\n"
                f"{official_context[:3500]}"
            )

        messages = [{"role": "system", "content": system_content}]

        # Add conversation history (keep last 10 turns for context window efficiency)
        if conversation_history:
            for msg in conversation_history[-20:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                })

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Try each provider in order
        last_error = "No LLM providers configured"

        for provider in self._providers:
            if not provider.is_available:
                continue

            try:
                logger.info("🧠 Trying LLM provider: %s", provider.name)

                start = time.perf_counter()
                completion = await asyncio.to_thread(
                    provider.client.chat.completions.create,  # type: ignore[arg-type]
                    model=provider.model,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=600,
                    top_p=0.9,
                    timeout=self._request_timeout_seconds,
                )
                elapsed_ms = int((time.perf_counter() - start) * 1000)

                reply = completion.choices[0].message.content.strip()

                logger.info(
                    "🧠 LLM response from %s in %dms: '%s'",
                    provider.name,
                    elapsed_ms,
                    reply[:80] + ("..." if len(reply) > 80 else ""),
                )

                reply = await self._ensure_language_purity(
                    provider=provider,
                    reply=reply,
                    language=language,
                    official_context=official_context,
                    user_message=user_message,
                )

                return {
                    "reply": reply,
                    "provider": provider.name,
                    "model": provider.model,
                    "success": True,
                }

            except RateLimitError as e:
                last_error = f"{provider.name} rate limited: {e}"
                logger.warning("⚠️ %s rate limited, trying next provider...", provider.name)
                continue

            except APIError as e:
                last_error = f"{provider.name} API error: {e}"
                logger.warning("⚠️ %s API error: %s, trying next provider...", provider.name, e)
                continue

            except Exception as e:
                last_error = f"{provider.name} error: {e}"
                logger.warning("⚠️ %s unexpected error: %s, trying next...", provider.name, e, exc_info=True)
                continue

        # All providers failed
        logger.error("❌ All LLM providers failed. Last error: %s", last_error)
        return {
            "reply": "",
            "provider": None,
            "model": None,
            "success": False,
            "error": f"All LLM providers failed. {last_error}",
        }

    def _is_language_pure(self, reply: str, language: str) -> bool:
        """Heuristically check whether the reply stays in the requested language/script."""
        if not reply.strip():
            return False

        latin_words = re.findall(r"[A-Za-z]+", reply)
        devanagari_chars = re.findall(r"[\u0900-\u097F]", reply)
        tamil_chars = re.findall(r"[\u0B80-\u0BFF]", reply)

        if language == "hi":
            # Allow a few proper nouns, but avoid mixed-script replies.
            return len(devanagari_chars) >= 8 and len(tamil_chars) == 0 and len(latin_words) <= 3

        if language == "ta":
            return len(tamil_chars) >= 8 and len(devanagari_chars) == 0 and len(latin_words) <= 3

        # English should not leak Devanagari or Tamil scripts.
        return len(devanagari_chars) == 0 and len(tamil_chars) == 0

    async def _ensure_language_purity(
        self,
        provider: LLMProvider,
        reply: str,
        language: str,
        official_context: str | None,
        user_message: str,
    ) -> str:
        """Rewrite the response if it mixes scripts or languages."""
        if self._is_language_pure(reply, language):
            return reply

        lang_names = {"en": "English", "hi": "Hindi", "ta": "Tamil"}
        lang_name = lang_names.get(language, "English")

        rewrite_messages = [
            {
                "role": "system",
                "content": (
                    f"Rewrite the assistant answer entirely in {lang_name}. "
                    "Use only that language and script. Do not mix in other languages. "
                    "Keep it short, clear, and suitable for speech."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"User message: {user_message}\n\n"
                    f"Original answer to rewrite: {reply}\n\n"
                    f"Official context: {official_context[:1500] if official_context else ''}"
                ),
            },
        ]

        try:
            rewritten = await asyncio.to_thread(
                provider.client.chat.completions.create,  # type: ignore[arg-type]
                model=provider.model,
                messages=rewrite_messages,
                temperature=0.0,
                max_tokens=220,
                top_p=1.0,
                timeout=self._request_timeout_seconds,
            )
            fixed_reply = rewritten.choices[0].message.content.strip()
            if fixed_reply and self._is_language_pure(fixed_reply, language):
                logger.info("🧠 Rewrote mixed-language reply into pure %s", lang_name)
                return fixed_reply
        except Exception as e:
            logger.warning("⚠️ Language purity rewrite failed: %s", e, exc_info=True)

        return reply


# Singleton
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
