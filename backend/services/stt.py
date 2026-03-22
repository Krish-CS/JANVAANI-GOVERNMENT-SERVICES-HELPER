"""
JanVaani — Speech-to-Text Service
Primary: Groq Whisper API (OpenAI-compatible).
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from openai import OpenAI

from backend.config import get_settings

logger = logging.getLogger("janvaani.stt")


class STTService:
    """Speech-to-Text using Groq Whisper API."""

    def __init__(self):
        settings = get_settings()
        self._model_name = settings.groq_stt_model
        self._client: OpenAI | None = None
        if settings.groq_api_key:
            self._client = OpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1",
            )
            logger.info("🎤 STT: Groq Whisper configured (model=%s)", self._model_name)
        else:
            logger.warning("⚠️ STT: Groq API key missing")

    @property
    def is_available(self) -> bool:
        return self._client is not None

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "en",
        filename: str = "audio.webm",
    ) -> dict:
        """Transcribe audio bytes to text using Groq Whisper API."""
        return await asyncio.to_thread(
            self._transcribe_sync,
            audio_bytes,
            language,
            filename,
        )

    def _transcribe_sync(
        self,
        audio_bytes: bytes,
        language: str = "en",
        filename: str = "audio.webm",
    ) -> dict:
        if self._client is None:
            return {
                "text": "",
                "language": language,
                "duration": 0,
                "success": False,
                "error": "STT provider not configured",
            }

        ext = Path(filename).suffix.lower() or ".webm"
        if ext not in {".webm", ".wav", ".mp3", ".mp4", ".m4a", ".ogg", ".flac"}:
            ext = ".webm"
        safe_filename = f"audio{ext}"
        mime_map = {
            ".webm": "audio/webm",
            ".wav": "audio/wav",
            ".mp3": "audio/mpeg",
            ".mp4": "audio/mp4",
            ".m4a": "audio/mp4",
            ".ogg": "audio/ogg",
            ".flac": "audio/flac",
        }
        try:
            response = self._client.audio.transcriptions.create(
                model=self._model_name,
                file=(safe_filename, audio_bytes, mime_map.get(ext, "audio/webm")),
                language=language or None,
                response_format="verbose_json",
            )

            text = (getattr(response, "text", "") or "").strip()
            duration = float(getattr(response, "duration", 0.0) or 0.0)
            detected_language = getattr(response, "language", language) or language

            logger.info("🎤 STT API result: lang=%s, duration=%.1fs, text='%s'", detected_language, duration, text[:80] + ("..." if len(text) > 80 else ""))

            return {
                "text": text,
                "language": detected_language,
                "duration": round(duration, 2),
                "success": True,
            }
        except Exception as e:
            logger.error("❌ STT API error: %s", e, exc_info=True)
            return {
                "text": "",
                "language": language,
                "duration": 0,
                "success": False,
                "error": f"STT failed: {str(e)}",
            }


# Singleton
_stt_service: STTService | None = None


def get_stt_service() -> STTService:
    global _stt_service
    if _stt_service is None:
        _stt_service = STTService()
    return _stt_service
