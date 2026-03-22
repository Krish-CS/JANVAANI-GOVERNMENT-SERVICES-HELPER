"""
JanVaani Backend — Configuration
Loads environment variables with validation and defaults.
"""

from __future__ import annotations

import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


# Get the directory where this config.py file is located
BACKEND_DIR = Path(__file__).parent
ENV_FILE_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # ── Groq (LLM Primary) ─────────────────────────────────────────────
    groq_api_key: str = Field(default="", description="Groq API key for LLM")
    groq_llm_model: str = Field(default="openai/gpt-oss-120b", description="Groq LLM model")

    # ── Cerebras (LLM Backup 1) ───────────────────────────────────────
    cerebras_api_key: str = Field(default="", description="Cerebras API key")
    cerebras_llm_model: str = Field(default="llama-3.3-70b", description="Cerebras LLM model")

    # ── NVIDIA NIM (LLM Backup 2) ─────────────────────────────────────
    nvidia_api_key: str = Field(default="", description="NVIDIA NIM API key")
    nvidia_llm_model: str = Field(default="meta/llama-3.1-70b-instruct", description="NVIDIA LLM model")

    # ── STT (Groq Whisper API) ────────────────────────────────────────
    groq_stt_model: str = Field(default="whisper-large-v3-turbo", description="Groq STT model")

    # ── TTS Providers (API-based) ─────────────────────────────────────
    azure_speech_key: str = Field(default="", description="Azure Speech API key for TTS")
    azure_speech_region: str = Field(default="", description="Azure Speech region for TTS")
    azure_tts_voice_en: str = Field(default="en-IN-NeerjaNeural", description="Azure English voice")
    azure_tts_voice_hi: str = Field(default="hi-IN-SwaraNeural", description="Azure Hindi voice")
    azure_tts_voice_ta: str = Field(default="ta-IN-PallaviNeural", description="Azure Tamil voice")
    azure_tts_output_format: str = Field(
        default="riff-24khz-16bit-mono-pcm",
        description="Azure TTS output format",
    )

    sarvam_api_key: str = Field(default="", description="Sarvam API key for TTS")
    sarvam_tts_model: str = Field(default="bulbul:v1", description="Sarvam TTS model")
    sarvam_tts_endpoint: str = Field(
        default="https://api.sarvam.ai/text-to-speech",
        description="Sarvam TTS endpoint",
    )

    bhashini_user_id: str = Field(default="", description="Bhashini user id")
    bhashini_api_key: str = Field(default="", description="Bhashini API key")
    bhashini_pipeline_id: str = Field(default="", description="Bhashini TTS pipeline id")
    bhashini_tts_endpoint: str = Field(
        default="https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
        description="Bhashini pipeline endpoint",
    )

    # ── Application ───────────────────────────────────────────────────
    frontend_url: str = Field(default="http://localhost:5173", description="Frontend URL for CORS")
    port: int = Field(default=8000, description="Server port")
    log_level: str = Field(default="info", description="Logging level")
    llm_request_timeout_seconds: float = Field(default=20.0, description="Per-provider LLM request timeout")
    llm_max_retries: int = Field(default=1, description="LLM provider max retries")
    tts_generation_timeout_seconds: float = Field(default=20.0, description="Max seconds to wait for TTS generation")

    # ── Language mappings ─────────────────────────────────────────────
    @property
    def supported_languages(self) -> dict[str, dict[str, str]]:
        return {
            "en": {"name": "English", "iso": "en", "bcp47": "en-IN"},
            "hi": {"name": "Hindi", "iso": "hi", "bcp47": "hi-IN"},
            "ta": {"name": "Tamil", "iso": "ta", "bcp47": "ta-IN"},
            "te": {"name": "Telugu", "iso": "te", "bcp47": "te-IN"},
            "bn": {"name": "Bengali", "iso": "bn", "bcp47": "bn-IN"},
            "mr": {"name": "Marathi", "iso": "mr", "bcp47": "mr-IN"},
            "gu": {"name": "Gujarati", "iso": "gu", "bcp47": "gu-IN"},
            "kn": {"name": "Kannada", "iso": "kn", "bcp47": "kn-IN"},
            "ml": {"name": "Malayalam", "iso": "ml", "bcp47": "ml-IN"},
        }

    def get_lang_config(self, lang_code: str) -> dict[str, str]:
        return self.supported_languages.get(lang_code, self.supported_languages["en"])

    model_config = {"env_file": str(ENV_FILE_PATH), "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
