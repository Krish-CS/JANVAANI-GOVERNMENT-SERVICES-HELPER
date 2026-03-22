# JanVaani - Government Services Helper

JanVaani is a source-grounded, multilingual voice assistant for government service guidance in India. It helps users ask in natural language, hear the answer back, and then move into a guide or YouTube walkthrough when one is available.

## Live URLs

- Frontend: https://janvaani-navy.vercel.app
- Backend: https://janvaani.onrender.com

## What it does

- Converts speech to text for supported Indian languages and English.
- Uses an LLM to answer in the same language the user spoke.
- Grounds answers in official service data, government web pages, and curated service records.
- Generates step-by-step guides for selected services.
- Suggests relevant YouTube tutorials when available.
- Provides audio responses through API-based TTS with fallback providers.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Lucide React icons
- `react-intersection-observer`

### Backend

- FastAPI
- Uvicorn
- Python 3.12+
- OpenAI-compatible SDK
- Pydantic settings
- HTTPX
- BeautifulSoup4
- YouTube search libraries

### AI and Speech Providers

- Groq for STT and the primary LLM provider
- Cerebras as an LLM fallback
- NVIDIA NIM as an LLM fallback
- Azure Speech TTS as the primary speech output provider
- Sarvam and Bhashini as TTS fallbacks

## Core Model and Provider Setup

- Primary Groq LLM model: `openai/gpt-oss-120b`
- STT model: `whisper-large-v3-turbo`
- TTS voices:
  - English: `en-IN-NeerjaNeural`
  - Hindi: `hi-IN-SwaraNeural`
  - Tamil: `ta-IN-PallaviNeural`

## How the app works

1. The user speaks or types a request.
2. The backend transcribes speech if needed.
3. The LLM generates a short answer in the same language.
4. The guide engine checks official pages and curated records.
5. The frontend can show a guide or YouTube results when the service is identifiable.
6. The response is spoken back through the configured TTS provider.

## Backend endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health and provider availability |
| GET | `/api/config` | Frontend-safe feature config |
| POST | `/api/stt` | Speech to text |
| POST | `/api/chat` | Text to text conversation |
| POST | `/api/tts` | Text to speech |
| POST | `/api/conversation` | Full speech pipeline |
| POST | `/api/text-conversation` | Text pipeline with guide support |

## Project documentation

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [How to run](HOW_TO_RUN.txt)
- [Detailed report](DETAILED_REPORT.txt)

## Quick start

1. Install the frontend dependencies with `npm install`.
2. Install backend dependencies with `pip install -r backend/requirements.txt`.
3. Copy `backend/.env.example` to `backend/.env` and add your API keys.
4. Start the frontend with `npm run dev`.
5. Start the backend with `uvicorn backend.main:app --reload --port 8000`.

## Local development values

- Frontend URL: `http://localhost:5173`
- Backend URL: `http://localhost:8000`
- If you switch back to local development, uncomment the localhost lines in `backend/.env` and point `VITE_API_URL` back to `http://localhost:8000`.

## Notes

- Keep `.env` files out of git.
- The repo is designed to work with official government sources first, not AI-only guesses.
- The assistant is advisory only and does not submit applications on the user’s behalf.

## Repository layout

```
.
├── src/
│   ├── components/
│   ├── services/
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   ├── data/
│   ├── services/
│   ├── main.py
│   ├── config.py
│   └── requirements.txt
├── docs/
│   └── PROJECT_OVERVIEW.md
├── HOW_TO_RUN.txt
├── DETAILED_REPORT.txt
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## 👥 Team JanVaani

Built with ❤️ for Digital India 🇮🇳

*Bridging the digital divide, one voice at a time.*

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
