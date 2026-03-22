"""
JanVaani — Text-to-Speech Service
Primary: Azure Speech TTS API, fallback: Sarvam and Bhashini APIs.
"""

from __future__ import annotations

import asyncio
import base64
import logging
from dataclasses import dataclass
from xml.sax.saxutils import escape

import httpx

from backend.config import get_settings

logger = logging.getLogger("janvaani.tts")
SARVAM_LANG_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
}

AZURE_LOCALE_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "ta": "ta-IN",
}

@dataclass
class TTSProviderResult:
    success: bool
    provider: str | None = None
    audio_base64: str = ""
    content_type: str = "audio/wav"
    error: str | None = None


class TTSService:
    """API-based TTS with provider fallback."""

    def __init__(self):
        settings = get_settings()
        self._azure_speech_key = settings.azure_speech_key
        self._azure_speech_region = settings.azure_speech_region
        self._azure_tts_voice_en = settings.azure_tts_voice_en
        self._azure_tts_voice_hi = settings.azure_tts_voice_hi
        self._azure_tts_voice_ta = settings.azure_tts_voice_ta
        self._azure_tts_output_format = settings.azure_tts_output_format

        self._sarvam_api_key = settings.sarvam_api_key
        self._sarvam_tts_model = settings.sarvam_tts_model
        self._sarvam_tts_endpoint = settings.sarvam_tts_endpoint
        self._bhashini_user_id = settings.bhashini_user_id
        self._bhashini_api_key = settings.bhashini_api_key
        self._bhashini_pipeline_id = settings.bhashini_pipeline_id
        self._bhashini_tts_endpoint = settings.bhashini_tts_endpoint
        self._timeout_seconds = settings.tts_generation_timeout_seconds

        logger.info(
            "🔊 TTS providers configured: Azure=%s, Sarvam=%s, Bhashini=%s",
            "yes" if (self._azure_speech_key and self._azure_speech_region) else "no",
            "yes" if self._sarvam_api_key else "no",
            "yes" if (self._bhashini_user_id and self._bhashini_api_key and self._bhashini_pipeline_id) else "no",
        )
        logger.info("🔊 TTS failover order: Azure -> Sarvam -> Bhashini")

    @property
    def is_available(self) -> bool:
        return bool(
            (self._azure_speech_key and self._azure_speech_region)
            or self._sarvam_api_key
            or (self._bhashini_user_id and self._bhashini_api_key and self._bhashini_pipeline_id)
        )

    async def synthesize(
        self,
        text: str,
        language: str = "en",
    ) -> dict:
        """Convert text to speech audio using API providers with fallback."""
        if not text.strip():
            return {
                "audio_base64": "",
                "content_type": "audio/wav",
                "provider": None,
                "success": False,
                "error": "Empty text",
            }

        text = " ".join(text.split())[:700]
        logger.info("🔊 TTS request received: lang=%s, chars=%d", language, len(text))

        providers: list = []
        if self._azure_speech_key and self._azure_speech_region:
            providers.append(self._synthesize_azure)
        if self._sarvam_api_key:
            providers.append(self._synthesize_sarvam)
        if self._bhashini_user_id and self._bhashini_api_key and self._bhashini_pipeline_id:
            providers.append(self._synthesize_bhashini)

        if not providers:
            logger.error("❌ TTS unavailable: no provider credentials configured (Azure/Sarvam/Bhashini)")
            return {
                "audio_base64": "",
                "content_type": "audio/wav",
                "provider": None,
                "success": False,
                "error": "No TTS API provider configured",
            }

        last_error = "TTS provider failure"
        for provider_call in providers:
            logger.info("🔊 TTS trying provider: %s", provider_call.__name__.replace("_synthesize_", "").capitalize())
            result = await provider_call(text, language)
            if result.success:
                logger.info("🔊 TTS success via %s (lang=%s)", result.provider, language)
                return {
                    "audio_base64": result.audio_base64,
                    "content_type": result.content_type,
                    "provider": result.provider,
                    "success": True,
                }
            if result.error:
                last_error = result.error
                logger.warning("⚠️ TTS provider failed (%s): %s", result.provider or "unknown", result.error)

        logger.error("❌ TTS failed for all providers: %s", last_error)
        return {
            "audio_base64": "",
            "content_type": "audio/wav",
            "provider": None,
            "success": False,
            "error": last_error,
        }

    async def _synthesize_azure(self, text: str, language: str) -> TTSProviderResult:
        try:
            voice = self._voice_for_language(language)
            locale = AZURE_LOCALE_MAP.get(language, "en-IN")
            ssml_text = escape(text)
            ssml = (
                f"<speak version='1.0' xml:lang='{locale}'>"
                f"<voice name='{voice}'>{ssml_text}</voice>"
                "</speak>"
            )

            endpoint = (
                f"https://{self._azure_speech_region}.tts.speech.microsoft.com/cognitiveservices/v1"
            )
            headers = {
                "Ocp-Apim-Subscription-Key": self._azure_speech_key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": self._azure_tts_output_format,
                "User-Agent": "janvaani-backend",
            }

            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                resp = await client.post(endpoint, headers=headers, content=ssml.encode("utf-8"))

            if resp.status_code >= 400:
                return TTSProviderResult(
                    success=False,
                    provider="Azure Speech",
                    error=f"Azure error {resp.status_code}: {resp.text[:200]}",
                )

            content_type = resp.headers.get("content-type", "audio/wav")
            return TTSProviderResult(
                success=True,
                provider="Azure Speech",
                audio_base64=base64.b64encode(resp.content).decode("utf-8"),
                content_type=content_type,
            )
        except Exception as e:
            logger.warning("⚠️ Azure TTS failed: %s", e)
            return TTSProviderResult(success=False, provider="Azure Speech", error=f"Azure failed: {str(e)}")

    def _voice_for_language(self, language: str) -> str:
        if language == "hi":
            return self._azure_tts_voice_hi
        if language == "ta":
            return self._azure_tts_voice_ta
        return self._azure_tts_voice_en

    async def _synthesize_sarvam(self, text: str, language: str) -> TTSProviderResult:
        try:
            payload = {
                "inputs": [text],
                "target_language_code": SARVAM_LANG_MAP.get(language, "en-IN"),
                "model": self._sarvam_tts_model,
            }
            headers = {
                "api-subscription-key": self._sarvam_api_key,
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                resp = await client.post(self._sarvam_tts_endpoint, headers=headers, json=payload)

            if resp.status_code >= 400:
                return TTSProviderResult(success=False, provider="Sarvam", error=f"Sarvam error {resp.status_code}: {resp.text[:200]}")

            content_type = resp.headers.get("content-type", "")
            if content_type.startswith("audio/"):
                return TTSProviderResult(
                    success=True,
                    provider="Sarvam",
                    audio_base64=base64.b64encode(resp.content).decode("utf-8"),
                    content_type=content_type,
                )

            data = resp.json()
            audio_candidate = self._extract_audio_base64(data)
            if audio_candidate:
                return TTSProviderResult(success=True, provider="Sarvam", audio_base64=audio_candidate)

            return TTSProviderResult(success=False, provider="Sarvam", error="Sarvam response did not include audio")

        except Exception as e:
            logger.warning("⚠️ Sarvam TTS failed: %s", e)
            return TTSProviderResult(success=False, provider="Sarvam", error=f"Sarvam failed: {str(e)}")

    async def _synthesize_bhashini(self, text: str, language: str) -> TTSProviderResult:
        try:
            payload = {
                "pipelineTasks": [
                    {
                        "taskType": "tts",
                        "config": {
                            "language": {"sourceLanguage": language},
                            "serviceId": self._bhashini_pipeline_id,
                        },
                    }
                ],
                "inputData": {
                    "input": [
                        {"source": text}
                    ]
                },
            }
            headers = {
                "userID": self._bhashini_user_id,
                "ulcaApiKey": self._bhashini_api_key,
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                resp = await client.post(self._bhashini_tts_endpoint, headers=headers, json=payload)

            if resp.status_code >= 400:
                return TTSProviderResult(success=False, provider="Bhashini", error=f"Bhashini error {resp.status_code}: {resp.text[:200]}")

            data = resp.json()
            audio_candidate = self._extract_audio_base64(data)
            if audio_candidate:
                return TTSProviderResult(success=True, provider="Bhashini", audio_base64=audio_candidate)

            return TTSProviderResult(success=False, provider="Bhashini", error="Bhashini response did not include audio")
        except Exception as e:
            logger.warning("⚠️ Bhashini TTS failed: %s", e)
            return TTSProviderResult(success=False, provider="Bhashini", error=f"Bhashini failed: {str(e)}")

    def _extract_audio_base64(self, payload: dict) -> str:
        candidates = [
            payload.get("audio"),
            payload.get("audio_base64"),
            payload.get("data", {}).get("audio") if isinstance(payload.get("data"), dict) else None,
            payload.get("output", {}).get("audio") if isinstance(payload.get("output"), dict) else None,
        ]
        audios = payload.get("audios")
        if isinstance(audios, list) and audios:
            candidates.append(audios[0])
        for candidate in candidates:
            if isinstance(candidate, str) and candidate:
                if candidate.startswith("data:audio") and "," in candidate:
                    return candidate.split(",", 1)[1]
                return candidate
        return ""

    def close(self):
        """Placeholder for API compatibility."""
        return None


# Singleton
_tts_service: TTSService | None = None


def get_tts_service() -> TTSService:
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
