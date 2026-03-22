import { useInView } from "react-intersection-observer";
import {
  Mic,
  Brain,
  Volume2,
  Server,
  Cloud,
  Zap,
  ArrowDown,
  CheckCircle2,
  Star,
} from "lucide-react";

const PIPELINE = [
  {
    step: "Speech-to-Text",
    icon: Mic,
    tech: "Groq Whisper API",
    model: "whisper-large-v3-turbo",
    langs: ["English ✅", "Hindi ✅", "Tamil ✅"],
    free: "28,800 sec/day",
    speed: "216× realtime",
    color: "from-cyan-400 to-blue-500",
    borderColor: "border-cyan-400/30",
    bgColor: "bg-cyan-400/5",
  },
  {
    step: "AI Brain (LLM)",
    icon: Brain,
    tech: "Groq + Cerebras + NVIDIA NIM",
    model: "openai/gpt-oss-120b",
    langs: ["Understands all languages"],
    free: "Multi-provider rotation",
    speed: "Instant inference",
    color: "from-violet-500 to-purple-600",
    borderColor: "border-violet-400/30",
    bgColor: "bg-violet-400/5",
  },
  {
    step: "Text-to-Speech",
    icon: Volume2,
    tech: "Voice output stack",
    model: "Azure Speech + browser fallback",
    langs: ["Hindi ✅", "Tamil ✅", "English ✅"],
    free: "Always works, ₹0",
    speed: "Natural Indian voices",
    color: "from-emerald-400 to-green-600",
    borderColor: "border-emerald-400/30",
    bgColor: "bg-emerald-400/5",
  },
];

const DEPLOY_STACK = [
  { name: "Frontend", tech: "React + Vite", host: "GitHub Pages / Vercel", icon: "🌐", free: true },
  { name: "Backend", tech: "FastAPI (Python)", host: "Render Free Tier", icon: "⚡", free: true },
  { name: "STT API", tech: "Groq Whisper", host: "Groq Cloud", icon: "🎤", free: true },
  { name: "LLM API", tech: "Llama 3.3 70B", host: "Groq / Cerebras", icon: "🧠", free: true },
  { name: "TTS API", tech: "Azure Speech + fallback voices", host: "Cloud APIs", icon: "🔊", free: true },
  { name: "Database", tech: "Supabase Postgres", host: "Supabase Free", icon: "💾", free: true },
];

export default function ArchitectureSection() {
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <section
      id="architecture"
      ref={ref}
      className="relative overflow-hidden bg-slate-950 py-24 sm:py-32"
      aria-label="Technical architecture"
    >
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/3 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center transition-all duration-700 ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-1.5">
            <Server className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-400">Architecture</span>
          </div>
          <h2 className="font-poppins text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Production{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              Tech Stack
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Zero local models. Zero GPU. Just lightweight API calls running on free-tier infrastructure, with guidance sourced from official pages and curated service records.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            The assistant first checks official portals and government pages, then blends that evidence with curated service data before it speaks or shows a guide.
          </p>
        </div>

        {/* Main Pipeline */}
        <div className="mt-16 space-y-6">
          {/* User input */}
          <div
            className={`mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            <span className="text-3xl">👤</span>
            <div>
              <p className="font-poppins font-bold text-white">User Speaks</p>
              <p className="text-sm text-slate-400">Into website mic or phone call</p>
            </div>
          </div>

          {PIPELINE.map((stage, i) => (
            <div key={stage.step}>
              {/* Arrow */}
              <div className="flex justify-center py-2">
                <ArrowDown className={`h-6 w-6 text-slate-600 ${inView ? "animate-fade-in-up" : "opacity-0"}`} />
              </div>

              {/* Stage card */}
              <div
                className={`mx-auto max-w-2xl overflow-hidden rounded-2xl border ${stage.borderColor} ${stage.bgColor} transition-all duration-700 ${
                  inView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${(i + 1) * 200}ms` }}
              >
                <div className={`bg-gradient-to-r ${stage.color} px-6 py-3`}>
                  <div className="flex items-center gap-3">
                    <stage.icon className="h-5 w-5 text-white" />
                    <span className="font-poppins font-bold text-white">{stage.step}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-poppins text-lg font-bold text-white">{stage.tech}</p>
                      <p className="mt-1 font-mono text-sm text-slate-400">{stage.model}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stage.langs.map((lang) => (
                          <span key={lang} className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                        <Zap className="h-3 w-3" /> {stage.free}
                      </div>
                      <p className="text-xs text-slate-500">{stage.speed}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Arrow */}
          <div className="flex justify-center py-2">
            <ArrowDown className={`h-6 w-6 text-slate-600 ${inView ? "animate-fade-in-up" : "opacity-0"}`} />
          </div>

          {/* User output */}
          <div
            className={`mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            <span className="text-3xl">👤</span>
            <div>
              <p className="font-poppins font-bold text-white">User Hears Response</p>
              <p className="text-sm text-emerald-400">Spoken back in their language — ~1.5s total</p>
            </div>
          </div>
        </div>

        {/* Deployment stack */}
        <div className="mt-24">
          <h3
            className={`mb-10 text-center font-poppins text-2xl font-bold text-white transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            Deployment Map — All Free Tier
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEPLOY_STACK.map((item, i) => (
              <div
                key={item.name}
                className={`group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/70 ${
                  inView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${1200 + i * 100}ms` }}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-poppins text-sm font-bold text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.tech}</p>
                  <p className="text-xs text-slate-500">{item.host}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> FREE
                </div>
              </div>
            ))}
          </div>

          {/* Cost summary */}
          <div
            className={`mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-slate-300">No GPU Required</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-slate-300">512MB RAM Sufficient</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-slate-300">Zero Local Models</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div>
                <span className="font-poppins text-2xl font-black text-emerald-400">₹0</span>
                <span className="ml-1 text-sm text-slate-400">Total Cost</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
