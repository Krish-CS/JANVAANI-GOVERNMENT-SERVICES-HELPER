/**
 * JanVaani — Frontend API Service
 * Connects to FastAPI backend with automatic fallback to demo mode.
 */

// ─── Configuration ───────────────────────────────────────────────────
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://janvaani-api.onrender.com");

const LOCALHOST_FALLBACK_URLS = [
  "http://localhost:8000",
  "http://localhost:8001",
  "http://localhost:8002",
];

// ─── Types ───────────────────────────────────────────────────────────
export interface HealthStatus {
  status: string;
  services: {
    stt: { available: boolean; provider: string };
    llm: { available: boolean; provider: string };
    tts: { available: boolean; provider: string };
  };
  version: string;
}

export interface BackendConfig {
  services_available: {
    stt: boolean;
    llm: boolean;
    tts: boolean;
  };
  supported_languages: string[];
  features: {
    speech_to_text: boolean;
    text_chat: boolean;
    text_to_speech: boolean;
    full_pipeline: boolean;
  };
}

export interface STTResult {
  text: string;
  language: string;
  duration: number;
  success: boolean;
  error?: string;
}

export interface ChatResult {
  reply: string;
  provider: string | null;
  model: string | null;
  session_id: string;
  success: boolean;
  error?: string;
}

export interface TTSResult {
  audio_base64: string;
  content_type: string;
  provider: string | null;
  success: boolean;
  error?: string;
}

export interface ConversationResult {
  user_text: string;
  stt_success: boolean;
  reply_text: string;
  llm_provider: string | null;
  llm_success: boolean;
  audio_base64: string;
  audio_content_type: string;
  tts_provider: string | null;
  tts_success: boolean;
  session_id: string;
  total_time_ms: number;
  error?: string;
}

export interface TextConversationResult {
  reply_text: string;
  llm_provider: string | null;
  llm_success: boolean;
  audio_base64: string;
  audio_content_type: string;
  tts_provider: string | null;
  tts_success: boolean;
  session_id: string;
  total_time_ms: number;
  error?: string;
}

// ─── API Client ──────────────────────────────────────────────────────
class JanVaaniAPI {
  private baseUrl: string;
  private _isBackendAvailable: boolean | null = null;
  private _backendConfig: BackendConfig | null = null;
  private readonly candidateBaseUrls: string[];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    if (window.location.hostname === "localhost") {
      const normalized = this.baseUrl.replace("127.0.0.1", "localhost");
      this.candidateBaseUrls = [
        normalized,
        ...LOCALHOST_FALLBACK_URLS.filter((url) => url !== normalized),
      ];
    } else {
      this.candidateBaseUrls = [this.baseUrl];
    }
  }

  // ── Health & Config ──────────────────────────────────────────────

  async checkHealth(): Promise<HealthStatus | null> {
    for (const candidate of this.candidateBaseUrls) {
      try {
        const res = await fetch(`${candidate}/api/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        this.baseUrl = candidate;
        this._isBackendAvailable = true;
        return data;
      } catch {
        continue;
      }
    }

    this._isBackendAvailable = false;
    return null;
  }

  async getConfig(): Promise<BackendConfig | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/config`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      this._backendConfig = await res.json();
      return this._backendConfig;
    } catch {
      return null;
    }
  }

  get isBackendAvailable(): boolean | null {
    return this._isBackendAvailable;
  }

  get backendConfig(): BackendConfig | null {
    return this._backendConfig;
  }

  private async requestWithFallback(
    path: string,
    init: RequestInit,
    timeoutMs: number = 12000
  ): Promise<Response> {
    const candidates = [
      this.baseUrl,
      ...this.candidateBaseUrls.filter((url) => url !== this.baseUrl),
    ];

    let lastError: unknown = null;
    for (const candidate of candidates) {
      try {
        const res = await fetch(`${candidate}${path}`, {
          ...init,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) {
          // Retry another candidate on transient server errors.
          if (res.status >= 500) {
            lastError = new Error(`HTTP ${res.status}`);
            continue;
          }
          this.baseUrl = candidate;
          return res;
        }
        this.baseUrl = candidate;
        return res;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Backend request failed");
  }

  // ── Speech-to-Text ──────────────────────────────────────────────

  async speechToText(audioBlob: Blob, language: string = "en"): Promise<STTResult> {
    const formData = new FormData();
    formData.append("audio", audioBlob, `recording.${getExtension(audioBlob.type)}`);
    formData.append("language", language);

    const res = await this.requestWithFallback(
      "/api/stt",
      {
        method: "POST",
        body: formData,
      },
      30000
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`STT failed: ${res.status} — ${err}`);
    }

    return res.json();
  }

  // ── LLM Chat ───────────────────────────────────────────────────

  async chat(
    message: string,
    language: string = "en",
    sessionId?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ChatResult> {
    const res = await this.requestWithFallback(
      "/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          language,
          session_id: sessionId,
          conversation_history: conversationHistory,
        }),
      },
      15000
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Chat failed: ${res.status} — ${err}`);
    }

    return res.json();
  }

  // ── Text-to-Speech ─────────────────────────────────────────────

  async textToSpeech(text: string, language: string = "en"): Promise<TTSResult> {
    const res = await this.requestWithFallback(
      "/api/tts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      },
      45000
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`TTS failed: ${res.status} — ${err}`);
    }

    return res.json();
  }

  // ── Full Pipeline (Speech → Text → LLM → Speech) ──────────────

  async fullConversation(
    audioBlob: Blob,
    language: string = "en",
    sessionId?: string
  ): Promise<ConversationResult> {
    const formData = new FormData();
    formData.append("audio", audioBlob, `recording.${getExtension(audioBlob.type)}`);
    formData.append("language", language);
    if (sessionId) formData.append("session_id", sessionId);

    const res = await this.requestWithFallback(
      "/api/conversation",
      {
        method: "POST",
        body: formData,
      },
      45000
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Conversation failed: ${res.status} — ${err}`);
    }

    return res.json();
  }

  // ── Text Conversation (Text → LLM → Speech) ───────────────────

  async textConversation(
    message: string,
    language: string = "en",
    sessionId?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<TextConversationResult> {
    const res = await this.requestWithFallback(
      "/api/text-conversation",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          language,
          session_id: sessionId,
          conversation_history: conversationHistory,
        }),
      },
      15000
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Text conversation failed: ${res.status} — ${err}`);
    }

    return res.json();
  }
}

// ─── Audio Utilities ─────────────────────────────────────────────────

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/webm;codecs=opus": "webm",
    "audio/ogg": "ogg",
    "audio/ogg;codecs=opus": "ogg",
    "audio/wav": "wav",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
  };
  return map[mimeType] || "webm";
}

/**
 * Play base64-encoded audio. Returns a promise that resolves when playback ends.
 */
export function playBase64Audio(
  base64Audio: string,
  contentType: string = "audio/wav"
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const binaryStr = atob(base64Audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: contentType });
      const url = URL.createObjectURL(blob);
      stopBase64AudioPlayback();
      const audio = new Audio(url);
      _currentPlaybackAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (_currentPlaybackAudio === audio) {
          _currentPlaybackAudio = null;
        }
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        if (_currentPlaybackAudio === audio) {
          _currentPlaybackAudio = null;
        }
        reject(e);
      };

      audio.play().catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

let _currentPlaybackAudio: HTMLAudioElement | null = null;

export function stopBase64AudioPlayback(): void {
  if (_currentPlaybackAudio) {
    _currentPlaybackAudio.pause();
    _currentPlaybackAudio.currentTime = 0;
    _currentPlaybackAudio = null;
  }
}

/**
 * Record audio from the microphone using MediaRecorder.
 * Returns the recorded Blob when stopped.
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Prefer webm/opus, fallback to whatever's available
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/ogg";

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start(100); // Collect in 100ms chunks
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Not recording"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.onerror = (e) => {
        this.cleanup();
        reject(e);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

// ─── Singleton Export ────────────────────────────────────────────────
export const api = new JanVaaniAPI();
export default api;
