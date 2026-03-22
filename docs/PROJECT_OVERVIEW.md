# Project Overview

JanVaani is a multilingual voice assistant for government service guidance. The project is built to help users understand public-service workflows without needing to read long web pages or navigate complex portals on their own.

## Live Deployment

- Frontend: https://janvaani-navy.vercel.app
- Backend: https://janvaani.onrender.com

## Product Goal

The goal is to reduce friction for citizens who need help with services such as Aadhaar updates, ration card workflows, PM Kisan checks, voter ID guidance, and similar public-service journeys.

## System Design

### Frontend

The frontend is built with React, TypeScript, and Vite. It provides:

- a hero section that explains the product clearly
- service-oriented sections for problem, solution, impact, and architecture
- a live demo area for speech interaction
- a guide viewer for step-by-step instructions
- YouTube results for tutorial videos when relevant

### Backend

The backend is built with FastAPI and Python. It provides:

- speech-to-text handling through Groq Whisper
- language-aware LLM routing through Groq, Cerebras, and NVIDIA NIM
- text-to-speech generation through Azure Speech, Sarvam, and Bhashini
- official-context gathering from curated data and scraped web pages
- guide generation for supported government services
- YouTube search for service tutorials

## Official Source Strategy

JanVaani is not designed as an AI-only answer box. The backend tries to ground responses in:

- curated service records
- official government websites
- latest scraped service pages
- service-specific document and step data

This is important because government processes change over time, and users should see the most reliable source available.

## Language Strategy

The assistant is designed to respond in the same language used by the user. Supported languages in the current implementation include:

- English
- Hindi
- Tamil
- Telugu
- Bengali
- Marathi
- Gujarati
- Kannada
- Malayalam

The backend also enforces language purity so the answer does not drift into mixed-script or mixed-language replies.

## Key APIs

- `GET /api/health`
- `GET /api/config`
- `POST /api/stt`
- `POST /api/chat`
- `POST /api/tts`
- `POST /api/conversation`
- `POST /api/text-conversation`

## Current Provider Setup

- STT: Groq Whisper API
- LLM primary: Groq with `openai/gpt-oss-120b`
- LLM fallback: Cerebras, then NVIDIA NIM
- TTS primary: Azure Speech
- TTS fallback: Sarvam, then Bhashini

## Deployment Notes

- Render is pinned to Python 3.12.0 through [backend/.python-version](../backend/.python-version) and the `PYTHON_VERSION` env var in [backend/render.yaml](../backend/render.yaml).
- Local development values remain documented in [backend/.env.example](../backend/.env.example) for manual switching back later.

## Files Worth Reading

- [README.md](../README.md)
- [HOW_TO_RUN.txt](../HOW_TO_RUN.txt)
- [DETAILED_REPORT.txt](../DETAILED_REPORT.txt)
- [backend/main.py](../backend/main.py)
- [backend/services/llm.py](../backend/services/llm.py)
- [backend/services/guide_generator.py](../backend/services/guide_generator.py)
- [backend/services/web_scraper.py](../backend/services/web_scraper.py)
- [backend/services/youtube_search.py](../backend/services/youtube_search.py)
