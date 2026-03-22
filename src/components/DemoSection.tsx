import { useState, useRef, useCallback, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
  Loader2,
  MessageSquare,
  Send,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
  Clock,
  Server,
  AlertCircle,
  BookOpen,
  Youtube,
} from "lucide-react";
import api, { AudioRecorder, playBase64Audio, stopBase64AudioPlayback } from "../services/api";
import type {
  ConversationResult,
} from "../services/api";
import GuideViewer from "./GuideViewer";
import YouTubeResults from "./YouTubeResults";
import {
  getGuide,
  searchYouTube,
  detectServiceIntent,
  getServiceYouTubeKeyword,
  type Guide,
  type YouTubeVideo,
} from "../utils/api";

type Language = "en" | "hi" | "ta";
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  meta?: {
    sttProvider?: string;
    llmProvider?: string;
    ttsProvider?: string;
    totalTime?: number;
  };
};

type BackendStatus = "checking" | "online" | "offline";

type AssistantAction = {
  ready_for_guidance?: boolean;
  service_id?: string;
};

type PostResponseAvailability = {
  guide: boolean;
  videos: boolean;
};

function parseAssistantAction(rawReply: string): {
  cleanReply: string;
  action: AssistantAction | null;
} {
  const markerRegex = /<janvaani_action>([\s\S]*?)<\/janvaani_action>/i;
  const match = rawReply.match(markerRegex);

  const stripArtifacts = (text: string): string => {
    return text
      .replace(/<\/?janvaani_action[^>]*>/gi, "")
      .replace(/\{\s*"ready_for_guidance"\s*:[\s\S]*?"service_id"\s*:[\s\S]*?\}/gi, "")
      .replace(/<\/?janva[^>]*>/gi, "")
      .trim();
  };

  if (!match) {
    return { cleanReply: stripArtifacts(rawReply), action: null };
  }

  let action: AssistantAction | null = null;
  try {
    action = JSON.parse(match[1].trim()) as AssistantAction;
  } catch {
    action = null;
  }

  const cleanReply = stripArtifacts(rawReply.replace(markerRegex, ""));
  return { cleanReply, action };
}

const LANG_CONFIG: Record<
  Language,
  {
    label: string;
    native: string;
    font: string;
    greeting: string;
    placeholder: string;
    flag: string;
  }
> = {
  en: {
    label: "English",
    native: "English",
    font: "font-inter",
    flag: "🇬🇧",
    greeting:
      "Hello! I am JanVaani, your digital government services assistant. How can I help you today? You can ask about ration cards, Aadhaar, pensions, and more.",
    placeholder: "Type or speak your question...",
  },
  hi: {
    label: "Hindi",
    native: "हिन्दी",
    font: "font-devanagari",
    flag: "🇮🇳",
    greeting:
      "नमस्ते! मैं जनवाणी हूँ, आपका डिजिटल सरकारी सेवा सहायक। मैं आपकी कैसे मदद कर सकता हूँ? आप राशन कार्ड, आधार, पेंशन आदि के बारे में पूछ सकते हैं।",
    placeholder: "अपना सवाल टाइप करें या बोलें...",
  },
  ta: {
    label: "Tamil",
    native: "தமிழ்",
    font: "font-tamil",
    flag: "🇮🇳",
    greeting:
      "வணக்கம்! நான் ஜனவாணி, உங்கள் டிஜிட்டல் அரசு சேவை உதவியாளர். நான் உங்களுக்கு எப்படி உதவ முடியும்? நீங்கள் ரேஷன் கார்டு, ஆதார், ஓய்வூதியம் போன்றவை பற்றி கேட்கலாம்.",
    placeholder: "உங்கள் கேள்வியை தட்டச்சு செய்யவும்...",
  },
};

// Demo fallback responses when backend is offline
const DEMO_RESPONSES: Record<Language, Record<string, string>> = {
  en: {
    ration:
      "To apply for a ration card, I'll need a few details. First, could you tell me your full name as it appears on your Aadhaar card?",
    aadhaar:
      "For Aadhaar update, you can update your address, mobile number, or name. Which detail would you like to update?",
    pension:
      "For the pension scheme, I can help you with PM Vaya Vandana Yojana or National Pension System. Which one interests you?",
    kisan:
      "For PM Kisan Samman Nidhi, I can help with new registration or check your payment status. What would you like to do?",
    birth:
      "For birth certificate, I can help you apply online or download an existing one. Do you need a new certificate or a copy?",
    voter:
      "For Voter ID card, I can help with new registration, correction, or download. What do you need?",
    ayushman:
      "For Ayushman Bharat (PMJAY), I can check your eligibility or help find a nearby empanelled hospital. What would you like?",
    default:
      "I can help you with government services like ration cards, Aadhaar, pensions, PM Kisan, birth certificates, Voter ID, Ayushman Bharat and more. What would you like to know about?",
  },
  hi: {
    ration:
      "राशन कार्ड के लिए आवेदन करने के लिए मुझे कुछ जानकारी चाहिए। पहले, क्या आप मुझे अपना पूरा नाम बता सकते हैं जैसा आपके आधार कार्ड पर है?",
    aadhaar:
      "आधार अपडेट के लिए, आप अपना पता, मोबाइल नंबर या नाम अपडेट कर सकते हैं। आप कौन सी जानकारी अपडेट करना चाहते हैं?",
    pension:
      "पेंशन योजना के लिए, मैं आपकी PM वय वंदना योजना या राष्ट्रीय पेंशन प्रणाली में मदद कर सकता हूँ। आपकी किसमें रुचि है?",
    kisan:
      "पीएम किसान सम्मान निधि के लिए, मैं नई पंजीकरण या भुगतान स्थिति जांचने में मदद कर सकता हूँ। आप क्या करना चाहते हैं?",
    default:
      "मैं राशन कार्ड, आधार, पेंशन, PM किसान, जन्म प्रमाणपत्र जैसी सरकारी सेवाओं में आपकी मदद कर सकता हूँ। आप किसके बारे में जानना चाहते हैं?",
  },
  ta: {
    ration:
      "ரேஷன் கார்டுக்கு விண்ணப்பிக்க, எனக்கு சில விவரங்கள் தேவை. முதலில், உங்கள் ஆதார் கார்டில் உள்ளபடி உங்கள் முழு பெயரைச் சொல்ல முடியுமா?",
    aadhaar:
      "ஆதார் புதுப்பிப்புக்கு, உங்கள் முகவரி, மொபைல் எண் அல்லது பெயரைப் புதுப்பிக்கலாம். எந்த விவரத்தைப் புதுப்பிக்க விரும்புகிறீர்கள்?",
    pension:
      "ஓய்வூதியத் திட்டத்திற்கு, PM வய வந்தனா யோஜனா அல்லது தேசிய ஓய்வூதிய திட்டத்தில் உங்களுக்கு உதவ முடியும். எது உங்களுக்கு ஆர்வமாக உள்ளது?",
    default:
      "ரேஷன் கார்டு, ஆதார், ஓய்வூதியம், PM கிசான், பிறப்பு சான்றிதழ் போன்ற அரசு சேவைகளில் உங்களுக்கு உதவ முடியும். எதைப் பற்றி தெரிந்து கொள்ள விரும்புகிறீர்கள்?",
  },
};

function getDemoResponse(lang: Language, text: string): string {
  const lower = text.toLowerCase();
  const responses = DEMO_RESPONSES[lang];
  if (
    lower.includes("ration") ||
    lower.includes("राशन") ||
    lower.includes("ரேஷன்")
  )
    return responses.ration;
  if (
    lower.includes("aadhaar") ||
    lower.includes("aadhar") ||
    lower.includes("आधार") ||
    lower.includes("ஆதார்")
  )
    return responses.aadhaar;
  if (
    lower.includes("pension") ||
    lower.includes("पेंशन") ||
    lower.includes("ஓய்வூதிய")
  )
    return responses.pension;
  if (lower.includes("kisan") || lower.includes("किसान"))
    return responses.kisan || responses.default;
  if (
    lower.includes("birth") ||
    lower.includes("जन्म") ||
    lower.includes("பிறப்பு")
  )
    return responses.birth || responses.default;
  if (
    lower.includes("voter") ||
    lower.includes("वोटर") ||
    lower.includes("வாக்காளர்")
  )
    return responses.voter || responses.default;
  if (
    lower.includes("ayushman") ||
    lower.includes("आयुष्मान") ||
    lower.includes("ஆயுஷ்மான்")
  )
    return responses.ayushman || responses.default;
  return responses.default;
}

function VoiceWaveformLive({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            active
              ? "wave-bar bg-gradient-to-t from-red-500 to-red-400 w-1"
              : "bg-slate-700 w-0.5"
          }`}
          style={{
            height: active ? undefined : 4,
            animationDelay: `${i * 0.08}s`,
            animationPlayState: active ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}

// ─── Pipeline Stage Indicator ───────────────────────────────────────
function PipelineIndicator({
  stage,
}: {
  stage: "idle" | "recording" | "stt" | "llm" | "tts" | "playing" | "done";
}) {
  const stages = [
    { key: "stt", label: "🎤 STT", desc: "Groq Whisper" },
    { key: "llm", label: "🧠 LLM", desc: "Processing" },
    { key: "tts", label: "🔊 TTS", desc: "Generating" },
  ];

  if (stage === "idle" || stage === "recording" || stage === "done")
    return null;

  const activeIdx = stages.findIndex((s) => s.key === stage);

  return (
    <div className="flex items-center justify-center gap-1 py-2 animate-fade-in-up">
      <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 border border-slate-700/50">
        {stages.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                i === activeIdx
                  ? "bg-saffron/20 text-saffron-light animate-pulse"
                  : i < activeIdx
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {i < activeIdx ? "✅" : s.label}
              <span className="hidden sm:inline">{i === activeIdx ? s.desc : ""}</span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-px w-4 ${
                  i < activeIdx ? "bg-emerald-500/50" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function DemoSection({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<Language>("hi");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [pipelineStage, setPipelineStage] = useState<
    "idle" | "recording" | "stt" | "llm" | "tts" | "playing" | "done"
  >("idle");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // New features state
  const [currentGuide, setCurrentGuide] = useState<Guide | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [youtubeSearchUrl, setYoutubeSearchUrl] = useState("");
  const [showGuideViewer, setShowGuideViewer] = useState(false);
  const [showYouTubeResults, setShowYouTubeResults] = useState(false);
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "guide" | "videos">("chat");
  const [actionCue, setActionCue] = useState<"none" | "guide" | "videos" | "both">("none");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastReadGuideKeyRef = useRef("");
  const guideReadRunRef = useRef(0);

  const getPostResponsePrompt = useCallback((language: Language, availability: PostResponseAvailability) => {
    if (!availability.guide && !availability.videos) return null;

    if (availability.guide && availability.videos) {
      if (language === "hi") {
        return "नीचे दिए गए बटन से गाइड और यूट्यूब वीडियो भी देखें।";
      }
      if (language === "ta") {
        return "கீழே உள்ள பொத்தான்களை பயன்படுத்தி வழிகாட்டியையும் யூடியூப் வீடியோக்களையும் பார்க்கலாம்.";
      }
      return "You can view the guide and the YouTube videos using the buttons below.";
    }

    if (availability.guide) {
      if (language === "hi") {
        return "नीचे दिए गए बटन से गाइड देखें।";
      }
      if (language === "ta") {
        return "கீழே உள்ள பொத்தானை பயன்படுத்தி வழிகாட்டியை பார்க்கலாம்.";
      }
      return "You can view the guide using the button below.";
    }

    if (language === "hi") {
      return "नीचे दिए गए बटन से यूट्यूब वीडियो देखें।";
    }
    if (language === "ta") {
      return "கீழே உள்ள பொத்தானை பயன்படுத்தி யூடியூப் வீடியோக்களை பார்க்கலாம்.";
    }
    return "You can view the YouTube videos using the button below.";
  }, []);

  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }, []);

  const config = LANG_CONFIG[lang];

  // ── Check backend availability on mount ───────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const checkBackend = async () => {
      setBackendStatus("checking");
      const health = await api.checkHealth();
      if (!cancelled) {
        setBackendStatus(health ? "online" : "offline");
        if (health) {
          await api.getConfig();
        }
      }
    };

    checkBackend();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // ── Initialize with greeting ─────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          text: config.greeting,
          timestamp: new Date(),
        },
      ]);
      void speakAssistantText(config.greeting, lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Reset on language change ────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    stopAllAudio();
    setMessages([
      {
        id: "greeting-" + lang,
        role: "assistant",
        text: config.greeting,
        timestamp: new Date(),
      },
    ]);
    setSessionId(undefined); // Reset session for new language
    setPendingServiceId(null);
    setCurrentGuide(null);
    setYoutubeVideos([]);
    setYoutubeSearchUrl("");
    setShowGuideViewer(false);
    setShowYouTubeResults(false);
    setActiveTab("chat");
    void speakAssistantText(config.greeting, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, isOpen]);

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // ── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAllAudio();
      recorderRef.current.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Browser TTS (fallback) ───────────────────────────────────
  const speakTextBrowser = useCallback(
    (text: string, language: Language) => {
      if (isMuted) return;
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        language === "hi" ? "hi-IN" : language === "ta" ? "ta-IN" : "en-IN";
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        const langCode =
          language === "hi" ? "hi" : language === "ta" ? "ta" : "en";
        const matchVoice = voices.find((v) => v.lang.startsWith(langCode));
        if (matchVoice) utterance.voice = matchVoice;
        window.speechSynthesis.speak(utterance);
      }, 100);
    },
    [isMuted]
  );

  const speakTextBrowserAsync = useCallback(
    (text: string, language: Language): Promise<void> => {
      return new Promise((resolve) => {
        if (isMuted || !text.trim() || !window.speechSynthesis) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang =
          language === "hi" ? "hi-IN" : language === "ta" ? "ta-IN" : "en-IN";
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };

        const voices = window.speechSynthesis.getVoices();
        const langCode = language === "hi" ? "hi" : language === "ta" ? "ta" : "en";
        const matchVoice = voices.find((v) => v.lang.startsWith(langCode));
        if (matchVoice) utterance.voice = matchVoice;

        window.speechSynthesis.speak(utterance);
      });
    },
    [isMuted]
  );

  // ── Stop all audio ───────────────────────────────────────────
  const stopAllAudio = useCallback(() => {
    guideReadRunRef.current += 1;
    window.speechSynthesis.cancel();
    stopBase64AudioPlayback();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speakAssistantText = useCallback(
    async (text: string, language: Language) => {
      if (!text.trim()) return;
      if (isMuted) return;
      stopAllAudio();

      if (backendStatus === "online") {
        try {
          const ttsResult = await api.textToSpeech(text, language);
          if (ttsResult.success && ttsResult.audio_base64) {
            setIsSpeaking(true);
            await playBase64Audio(ttsResult.audio_base64, ttsResult.content_type);
            setIsSpeaking(false);
            return;
          }
        } catch {
          // Fallback to browser TTS below.
          setIsSpeaking(false);
        }
      }

      speakTextBrowser(text, language);
    },
    [backendStatus, isMuted, speakTextBrowser, stopAllAudio]
  );

  // ── Play backend TTS audio ──────────────────────────────────
  const playBackendAudio = useCallback(
    async (audioBase64: string, contentType: string, updatePipeline: boolean = true) => {
      if (!audioBase64) return;
      if (isMuted) return;
      try {
        stopAllAudio();
        setIsSpeaking(true);
        if (updatePipeline) setPipelineStage("playing");
        await playBase64Audio(audioBase64, contentType);
      } catch (err) {
        console.error("Audio playback error:", err);
      } finally {
        setIsSpeaking(false);
        if (updatePipeline) {
          setPipelineStage("done");
          setTimeout(() => setPipelineStage("idle"), 1000);
        }
      }
    },
    [isMuted, stopAllAudio]
  );

  const announceNextActions = useCallback(
    async (language: Language, availability: PostResponseAvailability) => {
      if (isMuted) return;
      const cue = availability.guide && availability.videos
        ? "both"
        : availability.guide
        ? "guide"
        : availability.videos
        ? "videos"
        : "none";

      if (cue === "none") return;

      setActionCue(cue);
      try {
        await wait(700);
        const prompt = getPostResponsePrompt(language, availability);
        if (!prompt) return;

        if (backendStatus === "online") {
          try {
            const ttsResult = await api.textToSpeech(prompt, language);
            if (ttsResult.success && ttsResult.audio_base64) {
              await playBackendAudio(
                ttsResult.audio_base64,
                ttsResult.content_type,
                false
              );
              return;
            }
          } catch {
            // Fall back to browser TTS below.
          }
        }

        await speakTextBrowserAsync(prompt, language);
      } finally {
        window.setTimeout(() => setActionCue("none"), 7000);
      }
    },
    [backendStatus, getPostResponsePrompt, isMuted, playBackendAudio, speakTextBrowserAsync, wait]
  );

  // ── Process voice input (FULL PIPELINE via backend) ─────────
  const processVoiceInput = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      setErrorMsg(null);

      if (backendStatus === "online") {
        try {
          // Full pipeline: Audio → STT → LLM → TTS
          setPipelineStage("stt");
          const result: ConversationResult = await api.fullConversation(
            audioBlob,
            lang,
            sessionId
          );

          // Update session
          if (result.session_id) setSessionId(result.session_id);

          if (!result.stt_success) {
            setErrorMsg(
              result.error || "Could not understand audio. Please try again."
            );
            setIsProcessing(false);
            setPipelineStage("idle");
            return;
          }

          // Add user message
          const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: result.user_text,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, userMsg]);

          // Track possible service intent, but do not open guide/demo yet.
          const detectedServiceId = detectServiceIntent(result.user_text);
          if (detectedServiceId) {
            setPendingServiceId(detectedServiceId);
          }

          if (!result.llm_success) {
            setErrorMsg(result.error || "AI processing failed.");
            setIsProcessing(false);
            setPipelineStage("idle");
            return;
          }

          // Add AI message
          setPipelineStage("tts");
          const { cleanReply, action } = parseAssistantAction(result.reply_text);

          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            text: cleanReply,
            timestamp: new Date(),
            meta: {
              llmProvider: result.llm_provider || undefined,
              ttsProvider: result.tts_provider || undefined,
              totalTime: result.total_time_ms,
            },
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsProcessing(false);

          const availabilityPromise = handleAssistantGuidanceAction(action, cleanReply);

          // Play audio
          if (result.tts_success && result.audio_base64) {
            await playBackendAudio(
              result.audio_base64,
              result.audio_content_type
            );
          } else {
            // Fallback to browser TTS
            await speakTextBrowserAsync(cleanReply, lang);
          }
          if (!isMuted) {
            const availability = await availabilityPromise;
            await announceNextActions(lang, availability);
          }
        } catch (err: any) {
          console.error("Backend conversation error:", err);
          setErrorMsg(
            "Backend error: " + (err.message || "Unknown error")
          );
          setIsProcessing(false);
          setPipelineStage("idle");
        }
      } else {
        // Demo mode — use browser Speech Recognition result
        // (we already have the text from the Web Speech API path)
        setIsProcessing(false);
        setPipelineStage("idle");
      }
    },
    [
      backendStatus,
      lang,
      sessionId,
      playBackendAudio,
      speakTextBrowser,
      announceNextActions,
    ]
  );

  // ── Process text input ──────────────────────────────────────
  const processTextInput = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Track possible service intent, but keep in chat until assistant confirms readiness.
      const detectedServiceId = detectServiceIntent(text.trim());
      if (detectedServiceId) {
        setPendingServiceId(detectedServiceId);
      }

      setIsProcessing(true);
      setErrorMsg(null);

      if (backendStatus === "online") {
        try {
          setPipelineStage("llm");
          const result = await api.textConversation(
            text.trim(),
            lang,
            sessionId,
            messages.map((m) => ({
              role: m.role,
              content: m.text,
            }))
          );

          if (result.session_id) setSessionId(result.session_id);

          if (!result.llm_success) {
            setErrorMsg(result.error || "AI processing failed.");
            setIsProcessing(false);
            setPipelineStage("idle");
            return;
          }

          const { cleanReply, action } = parseAssistantAction(result.reply_text);

          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            text: cleanReply,
            timestamp: new Date(),
            meta: {
              llmProvider: result.llm_provider || undefined,
            },
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsProcessing(false);
          setPipelineStage("idle");

          const availabilityPromise = handleAssistantGuidanceAction(action, cleanReply);

          if (result.tts_success && result.audio_base64) {
            setPipelineStage("tts");
            await playBackendAudio(result.audio_base64, result.audio_content_type);
          } else {
            await speakTextBrowserAsync(cleanReply, lang);
          }
          if (!isMuted) {
            const availability = await availabilityPromise;
            await announceNextActions(lang, availability);
          }
        } catch (err: any) {
          console.error("Text conversation error:", err);
          // Fall back to demo mode
          fallbackDemoResponse(text, lang);
        }
      } else {
        // Demo mode
        fallbackDemoResponse(text, lang);
      }
    },
    [
      backendStatus,
      lang,
      sessionId,
      playBackendAudio,
      speakTextBrowser,
      announceNextActions,
    ]
  );

  const fallbackDemoResponse = useCallback(
    (text: string, language: Language) => {
      setTimeout(() => {
        const response = getDemoResponse(language, text);
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: response,
          timestamp: new Date(),
          meta: { llmProvider: "Demo Mode" },
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsProcessing(false);
        setPipelineStage("idle");
        speakTextBrowser(response, language);
      }, 600 + Math.random() * 600);
    },
    [speakTextBrowser]
  );

  // ── Fetch Guide for Service ─────────────────────────────────
  const fetchGuideForService = useCallback(
    async (serviceId: string): Promise<PostResponseAvailability> => {
      setIsLoadingGuide(true);
      let guideAvailable = false;
      let videosAvailable = false;
      try {
        const result = await getGuide(serviceId, lang, true);
        if (result.success && result.guide) {
          guideAvailable = true;
          setCurrentGuide(result.guide);
          setShowGuideViewer(true);

          // Also fetch YouTube videos
          const keyword = getServiceYouTubeKeyword(result.guide, lang);
          setIsLoadingYouTube(true);
          try {
            const yt = await searchYouTube(keyword, lang, 18);
            if (yt.success) {
              setYoutubeVideos(yt.videos);
              setYoutubeSearchUrl(yt.search_url);
              setShowYouTubeResults(true);
              videosAvailable = yt.videos.length > 0;
            }
          } finally {
            setIsLoadingYouTube(false);
          }
        }
      } catch (err) {
        console.error("Guide fetch error:", err);
      } finally {
        setIsLoadingGuide(false);
      }
      return { guide: guideAvailable, videos: videosAvailable };
    },
    [lang]
  );

  const buildGuideNarrationSections = useCallback(
    (guide: Guide, language: Language): string[] => {
      const pick = (en: string, hi: string, ta: string) =>
        language === "hi" ? hi : language === "ta" ? ta : en;

      const sections: string[] = [
        pick(
          `Guide for ${guide.service_name}. I will read each section with a short pause so it is easier to follow.`,
          `${guide.service_name_hi} के लिए गाइड। मैं हर भाग के बीच थोड़ा विराम लेकर पढ़ूँगा ताकि समझना आसान रहे।`,
          `${guide.service_name_ta} க்கான வழிகாட்டி. ஒவ்வொரு பகுதிக்கும் இடையில் சிறிய இடைவெளியுடன் வாசிப்பேன், அதனால் பின்தொடர எளிதாக இருக்கும்.`
        ),
      ];

      guide.steps.forEach((step) => {
        const title = pick(step.title, step.title_hi, step.title_ta);
        const description = pick(step.description, step.description_hi, step.description_ta);
        sections.push(
          pick(
            `Step ${step.step_number}. ${title}. ${description}`,
            `चरण ${step.step_number}. ${title}. ${description}`,
            `படி ${step.step_number}. ${title}. ${description}`
          )
        );
      });

      sections.push(
        pick(
          `Required documents. ${guide.required_documents.map((doc, index) => `Item ${index + 1}. ${doc}.`).join(" ")}`,
          `आवश्यक दस्तावेज़। ${guide.required_documents_hi.map((doc, index) => `बिंदु ${index + 1}. ${doc}.`).join(" ")}`,
          `தேவையான ஆவணங்கள். ${guide.required_documents_ta.map((doc, index) => `உருப்படி ${index + 1}. ${doc}.`).join(" ")}`
        ),
        pick(
          `Eligibility. ${guide.eligibility}.`,
          `पात्रता। ${guide.eligibility_hi}.`,
          `தகுதி. ${guide.eligibility_ta}.`
        ),
        pick(
          `Fees. ${guide.fees}. Processing time. ${guide.processing_time}. Helpline. ${guide.helpline}.`,
          `शुल्क। ${guide.fees_hi}. प्रक्रिया समय। ${guide.processing_time_hi}. हेल्पलाइन। ${guide.helpline}.`,
          `கட்டணம். ${guide.fees_ta}. செயலாக்க நேரம். ${guide.processing_time_ta}. உதவி எண். ${guide.helpline}.`
        ),
        pick(
          guide.contact_note || "",
          guide.contact_note_hi || guide.contact_note || "",
          guide.contact_note_ta || guide.contact_note || ""
        ),
        pick(
          `Official website. ${guide.official_url}.`,
          `आधिकारिक वेबसाइट। ${guide.official_url}.`,
          `அதிகாரப்பூர்வ இணையதளம். ${guide.official_url}.`
        )
      );

      return sections.filter(Boolean);
    },
    []
  );

  const splitForTts = useCallback((text: string, maxLen: number = 700): string[] => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return [];

    const sentences = normalized.split(/(?<=[.!?।])\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if (!sentence) continue;
      if ((current + " " + sentence).trim().length <= maxLen) {
        current = (current + " " + sentence).trim();
      } else {
        if (current) chunks.push(current);
        if (sentence.length <= maxLen) {
          current = sentence;
        } else {
          const words = sentence.split(" ");
          let part = "";
          for (const word of words) {
            if ((part + " " + word).trim().length <= maxLen) {
              part = (part + " " + word).trim();
            } else {
              if (part) chunks.push(part);
              part = word;
            }
          }
          current = part;
        }
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }, []);

  const readGuideFully = useCallback(
    async (guide: Guide, language: Language) => {
      if (isMuted) return;

      const sections = buildGuideNarrationSections(guide, language);
      if (!sections.length) return;

      stopAllAudio();
      const runId = guideReadRunRef.current;
      setIsSpeaking(true);

      try {
        for (let index = 0; index < sections.length; index += 1) {
          if (guideReadRunRef.current !== runId || isMuted) break;

          const chunk = sections[index];
          const chunks = splitForTts(chunk, index === 0 ? 650 : 500);

          for (const part of chunks) {
            if (guideReadRunRef.current !== runId || isMuted) break;

            if (backendStatus === "online") {
              try {
                const ttsResult = await api.textToSpeech(part, language);
                if (ttsResult.success && ttsResult.audio_base64) {
                  await playBase64Audio(ttsResult.audio_base64, ttsResult.content_type);
                } else {
                  await speakTextBrowserAsync(part, language);
                }
              } catch {
                // Fall through to browser TTS.
                await speakTextBrowserAsync(part, language);
              }
            } else {
              await speakTextBrowserAsync(part, language);
            }

            if (guideReadRunRef.current !== runId || isMuted) break;
            if (index < sections.length - 1) {
              await wait(600);
            }
          }
        }
      } finally {
        setIsSpeaking(false);
      }
    },
    [backendStatus, buildGuideNarrationSections, isMuted, speakTextBrowserAsync, splitForTts, stopAllAudio, wait]
  );

  // Auto-read the full guide when Guide tab opens.
  useEffect(() => {
    if (!isOpen || activeTab !== "guide" || !currentGuide || isMuted) return;

    const readKey = `${currentGuide.service_id}:${lang}:full`;
    if (lastReadGuideKeyRef.current === readKey) return;
    lastReadGuideKeyRef.current = readKey;

    void readGuideFully(currentGuide, lang);
  }, [activeTab, currentGuide, isMuted, isOpen, lang, readGuideFully]);

  useEffect(() => {
    if (isMuted) {
      stopAllAudio();
    }
  }, [isMuted, stopAllAudio]);

  // ── Trigger guidance only after assistant confirms readiness ──────
  const handleAssistantGuidanceAction = useCallback(
    async (action: AssistantAction | null, assistantText: string): Promise<PostResponseAvailability> => {
      const serviceId =
        action?.service_id || pendingServiceId || detectServiceIntent(assistantText);

      if (serviceId) {
        const availability = await fetchGuideForService(serviceId);
        setPendingServiceId(null);
        return availability;
      }

      return { guide: false, videos: false };
    },
    [fetchGuideForService, pendingServiceId]
  );

  // ── Toggle recording ────────────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setPipelineStage("stt");

      try {
        const audioBlob = await recorderRef.current.stop();

        if (backendStatus === "online") {
          // Send to backend for full pipeline
          await processVoiceInput(audioBlob);
        } else {
          // Demo mode: use Web Speech API for STT
          setPipelineStage("idle");
        }
      } catch (err) {
        console.error("Recording stop error:", err);
        setPipelineStage("idle");
      }
      return;
    }

    // Start recording
    setErrorMsg(null);

    if (backendStatus === "online") {
      // Use MediaRecorder → send to backend
      try {
        await recorderRef.current.start();
        setIsRecording(true);
        setPipelineStage("recording");
      } catch (err: any) {
        setErrorMsg(
          "Microphone access denied. Please allow microphone permission."
        );
        console.error("Mic error:", err);
      }
    } else {
      // Demo mode: use Web Speech API
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMsg(
          "Speech recognition not supported in this browser. Please use Chrome."
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang =
        lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        processTextInput(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setErrorMsg("Could not recognize speech. Please try again.");
      };
      recognition.onend = () => setIsRecording(false);

      try {
        recognition.start();
        setIsRecording(true);
        setPipelineStage("recording");
      } catch (err) {
        setErrorMsg("Could not start speech recognition.");
      }
    }
  }, [isRecording, backendStatus, lang, processVoiceInput, processTextInput]);

  // ── Handle text submit ──────────────────────────────────────
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      processTextInput(textInput);
      setTextInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6">
      <div
        className={`relative flex flex-col overflow-hidden rounded-3xl border border-slate-700 bg-navy shadow-2xl shadow-black/50 transition-all duration-500 ${
          isFullscreen ? "h-full w-full" : "h-[90vh] w-full max-w-2xl"
        }`}
        role="dialog"
        aria-label="JanVaani Assistant"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-saffron-light shadow-lg shadow-saffron/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-poppins text-sm font-bold text-white">
                JanVaani Live
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-400">
                  Speech-to-Speech AI
                </p>
                {backendStatus === "online" ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                    <Wifi className="h-2.5 w-2.5" />
                    LIVE
                  </span>
                ) : backendStatus === "checking" ? (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[9px] font-bold text-yellow-400 border border-yellow-500/20">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    CONNECTING
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-500/20">
                    <WifiOff className="h-2.5 w-2.5" />
                    DEMO
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language selector */}
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-700 bg-slate-800/50 p-0.5 sm:p-1">
              {(["en", "hi", "ta"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-md px-2 py-1.5 text-[10px] sm:text-xs sm:px-3 font-semibold transition-all ${
                    lang === l
                      ? "bg-saffron text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {LANG_CONFIG[l].native}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => {
                stopAllAudio();
                recorderRef.current.cancel();
                setIsRecording(false);
                onClose();
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
              aria-label="Close demo"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Status bar ────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-800/50 bg-slate-900/40 px-4 py-2 sm:px-5">
          <div className="flex items-center gap-3 text-[10px] text-slate-500 sm:text-xs">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              {config.label}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              {messages.length}
            </span>
            {backendStatus === "online" && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Server className="h-3 w-3" />
                Backend
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium border ${
                isMuted
                  ? "bg-slate-700/40 text-slate-300 border-slate-600"
                  : "bg-slate-800/40 text-cyan-300 border-slate-700 hover:bg-slate-700/60"
              }`}
              aria-label={isMuted ? "Unmute voice" : "Mute voice"}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              {isMuted ? "Muted" : "Voice On"}
            </button>
            {isRecording && (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-red-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Recording...
              </span>
            )}
            {isSpeaking && (
              <button
                onClick={stopAllAudio}
                className="flex items-center gap-1.5 rounded-full bg-saffron/10 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-saffron-light hover:bg-saffron/20"
              >
                <Volume2 className="h-3 w-3" />
                Stop
              </button>
            )}
            {isProcessing && (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-cyan-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </span>
            )}
          </div>
        </div>

        {/* ── Error banner ──────────────────────────────────── */}
        {errorMsg && (
          <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-300 animate-fade-in-up">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="flex-1">{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* ── Tab Navigation ──────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/40 px-4 py-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "chat"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            💬 {lang === "hi" ? "चैट" : lang === "ta" ? "சாட்" : "Chat"}
          </button>
          {showGuideViewer && (
            <button
              onClick={() => setActiveTab("guide")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "guide"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : actionCue === "guide" || actionCue === "both"
                  ? "text-cyan-300 bg-cyan-500/10 border border-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,0.35)] animate-pulse"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              📋 {lang === "hi" ? "गाइड" : lang === "ta" ? "வழிகாட்டி" : "Guide"}
            </button>
          )}
          {showYouTubeResults && youtubeVideos.length > 0 && (
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "videos"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : actionCue === "videos" || actionCue === "both"
                  ? "text-red-300 bg-red-500/10 border border-red-400/40 shadow-[0_0_18px_rgba(239,68,68,0.35)] animate-pulse"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              📺 {lang === "hi" ? "वीडियो" : lang === "ta" ? "வீடியோ" : "Videos"}
              <span className="px-1.5 py-0.5 bg-red-500/30 text-red-300 text-[10px] rounded-full">
                {youtubeVideos.length}
              </span>
            </button>
          )}
        </div>

        {/* ── Tab Content Areas ──────────────────────────────── */}
        {activeTab === "guide" && showGuideViewer && currentGuide && (
          <div className="flex-1 overflow-y-auto p-4 animate-fade-in-up">
            <GuideViewer guide={currentGuide} language={lang} />
          </div>
        )}

        {activeTab === "videos" && showYouTubeResults && (
          <div className="flex-1 overflow-y-auto p-4 animate-fade-in-up">
            <YouTubeResults
              videos={youtubeVideos}
              searchUrl={youtubeSearchUrl}
              language={lang}
              compact={false}
            />
          </div>
        )}


        {/* Chat messages - always rendered but hidden when other tabs active */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 sm:p-5 sm:space-y-4 ${activeTab !== "chat" ? "hidden" : ""}`}>
          {/* Backend status message */}
          {backendStatus === "offline" && (
            <div className="flex justify-center animate-fade-in-up">
              <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 px-4 py-3 text-center max-w-sm">
                <p className="text-[11px] text-yellow-400/80 font-medium">
                  🔌 Backend not connected — running in demo mode
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Deploy the FastAPI backend to enable real AI responses with
                  Groq Whisper STT + LLM + voice output
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } animate-fade-in-up`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 ${
                  msg.role === "user"
                    ? "rounded-br-md bg-saffron/15 border border-saffron/20"
                    : "rounded-bl-md bg-slate-800/70 border border-slate-700/50"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  {msg.role === "assistant" ? (
                    <span className="text-[10px] sm:text-xs font-semibold text-cyan-400">
                      🤖 JanVaani
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-semibold text-saffron-light">
                      🗣️ You
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm leading-relaxed text-slate-200 ${config.font}`}
                >
                  {msg.text}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="text-[10px] text-slate-600">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {msg.meta?.llmProvider && (
                    <span className="flex items-center gap-1 text-[9px] text-slate-600">
                      <Zap className="h-2 w-2" />
                      {msg.meta.llmProvider}
                    </span>
                  )}
                  {msg.meta?.ttsProvider && (
                    <span className="flex items-center gap-1 text-[9px] text-slate-600">
                      <Volume2 className="h-2 w-2" />
                      {msg.meta.ttsProvider}
                    </span>
                  )}
                  {msg.meta?.totalTime && (
                    <span className="flex items-center gap-1 text-[9px] text-slate-600">
                      <Clock className="h-2 w-2" />
                      {msg.meta.totalTime}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="rounded-2xl rounded-bl-md bg-slate-800/70 border border-slate-700/50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    JanVaani is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicators for new features */}
          {isLoadingGuide && (
            <div className="flex justify-center animate-fade-in-up">
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Fetching step-by-step guide...</span>
              </div>
            </div>
          )}

          {isLoadingYouTube && (
            <div className="flex justify-center animate-fade-in-up">
              <div className="flex items-center gap-2 text-xs text-red-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Finding YouTube tutorials...</span>
              </div>
            </div>
          )}

          {(showGuideViewer || showYouTubeResults) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in-up">
              {showGuideViewer && (
                <button
                  onClick={() => setActiveTab("guide")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {lang === "hi"
                    ? "गाइड देखें"
                    : lang === "ta"
                    ? "வழிகாட்டி பார்க்க"
                    : "Open Guide"}
                </button>
              )}

              {showYouTubeResults && youtubeVideos.length > 0 && (
                <button
                  onClick={() => setActiveTab("videos")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
                >
                  <Youtube className="h-3.5 w-3.5" />
                  {lang === "hi"
                    ? "वीडियो ट्यूटोरियल"
                    : lang === "ta"
                    ? "வீடியோ பயிற்சிகள்"
                    : "Video Tutorials"}
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Pipeline Indicator ──────────────────────────────── */}
        <PipelineIndicator stage={pipelineStage} />

        {/* ── Waveform ─────────────────────────────────────────── */}
        <div
          className={`flex justify-center py-1.5 transition-opacity ${
            isRecording ? "opacity-100" : "opacity-30"
          }`}
        >
          <VoiceWaveformLive active={isRecording} />
        </div>

        {/* ── Input area ───────────────────────────────────────── */}
        <div className="border-t border-slate-800 bg-slate-900/50 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mic button */}
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`group relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl transition-all ${
                isRecording
                  ? "animate-recording bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "bg-gradient-to-br from-saffron to-saffron-light text-white shadow-lg shadow-saffron/20 hover:shadow-xl hover:shadow-saffron/30 hover:brightness-110"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
              )}
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-2xl animate-pulse-ring bg-red-500/50" />
                  <span
                    className="absolute inset-0 rounded-2xl animate-pulse-ring bg-red-500/30"
                    style={{ animationDelay: "0.5s" }}
                  />
                </>
              )}
            </button>

            {/* Text input */}
            <form
              onSubmit={handleTextSubmit}
              className="flex flex-1 items-center gap-2"
            >
              <input
                id="janvaani-message-input"
                name="janvaaniMessage"
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={config.placeholder}
                disabled={isRecording || isProcessing}
                className={`flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-saffron/50 focus:bg-slate-800 disabled:opacity-50 ${config.font}`}
              />
              <button
                type="submit"
                disabled={
                  !textInput.trim() || isProcessing || isRecording
                }
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-all hover:bg-saffron hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
          <p className="mt-2 text-center text-[9px] sm:text-[10px] text-slate-600">
            {backendStatus === "online" ? (
              <>
                🎤 Mic → Groq Whisper STT • 🧠 GPT-OSS 120B LLM • 🔊
                Voice output stack •{" "}
                <span className="text-emerald-500 font-semibold">
                  Full Pipeline Active
                </span>
              </>
            ) : (
              <>
                🎤 Click mic to speak • ⌨️ Type a message • Demo uses
                Browser Speech API (Chrome recommended)
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
