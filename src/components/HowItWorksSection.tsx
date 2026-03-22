import { useInView } from "react-intersection-observer";
import { Mic, Brain, Volume2, Languages, Clock, Shield } from "lucide-react";

const FLOW_STEPS = [
  {
    emoji: "👤",
    title: "User Speaks",
    example: {
      hi: "\"मुझे राशन कार्ड बनवाना है\"",
      ta: "\"எனக்கு ரேஷன் கார்டு வேணும்\"",
      en: "\"I need a ration card\"",
    },
    desc: "User speaks naturally in their language via phone call or web app",
    icon: Mic,
    color: "from-cyan-400 to-blue-500",
  },
  {
    emoji: "🎤",
    title: "Speech → Text",
    tech: "Groq Whisper API",
    desc: "Audio is converted to text using Whisper large-v3-turbo with 99%+ accuracy",
    icon: Languages,
    color: "from-blue-400 to-indigo-500",
  },
  {
    emoji: "🧠",
    title: "AI Understands",
    tech: "Llama 3.3 70B",
    desc: "LLM extracts intent, identifies the service needed, and uses official portal data plus curated service records to formulate the next question",
    icon: Brain,
    color: "from-violet-500 to-purple-600",
  },
  {
    emoji: "🔊",
    title: "Text → Speech",
    tech: "Azure Speech + fallback",
    desc: "Response is spoken back in natural Indian-accented voice in the user's language, including source-based guidance when available",
    icon: Volume2,
    color: "from-emerald-400 to-green-600",
  },
];

export default function HowItWorksSection() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative overflow-hidden bg-navy py-24 sm:py-32"
      aria-label="How JanVaani works"
    >
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center transition-all duration-700 ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">How It Works</span>
          </div>
          <h2 className="font-poppins text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Complete Round-Trip in{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              ~1.5 Seconds
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            From spoken word to spoken response — powered by cutting-edge AI, with source-grounded guidance from official pages and curated service data.
          </p>
        </div>

        {/* Flow diagram */}
        <div className="mt-16 flex flex-col items-center">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.title} className="w-full max-w-xl">
              {/* Step card */}
              <div
                className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition-all duration-500 hover:border-slate-700 ${
                  inView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${(i + 1) * 200}ms` }}
              >
                {/* Top gradient bar */}
                <div className={`h-1 bg-gradient-to-r ${step.color}`} />

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg transition-transform group-hover:scale-110`}>
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-poppins text-lg font-bold text-white">{step.title}</h3>
                        {step.tech && (
                          <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-400">
                            {step.tech}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
                      {step.example && (
                        <div className="mt-3 space-y-1">
                          {Object.entries(step.example).map(([langKey, text]) => (
                            <div key={langKey} className="flex items-center gap-2 text-xs">
                              <span className={`rounded px-1.5 py-0.5 font-mono font-bold ${
                                langKey === "hi" ? "bg-saffron/10 text-saffron-light" :
                                langKey === "ta" ? "bg-emerald-500/10 text-emerald-400" :
                                "bg-cyan-500/10 text-cyan-400"
                              }`}>
                                {langKey.toUpperCase()}
                              </span>
                              <span className={`text-slate-300 ${
                                langKey === "hi" ? "font-devanagari" :
                                langKey === "ta" ? "font-tamil" : ""
                              }`}>
                                {text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector */}
              {i < FLOW_STEPS.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className={`flex flex-col items-center gap-1 ${inView ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${(i + 1) * 200 + 100}ms` }}>
                    <div className="h-6 w-px bg-gradient-to-b from-slate-600 to-slate-800" />
                    <div className="h-2 w-2 rotate-45 border-b border-r border-slate-600" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Performance metrics */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Clock, label: "Response Time", value: "~1.5s", desc: "End-to-end latency", color: "text-cyan-400" },
            { icon: Shield, label: "Accuracy", value: "99%+", desc: "Speech recognition", color: "text-emerald-400" },
            { icon: Languages, label: "Languages", value: "3+", desc: "Hindi, Tamil, English", color: "text-saffron-light" },
          ].map((metric, i) => (
            <div
              key={metric.label}
              className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center transition-all duration-500 ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${1200 + i * 150}ms` }}
            >
              <metric.icon className={`mx-auto h-8 w-8 ${metric.color}`} />
              <div className={`mt-3 font-poppins text-3xl font-black ${metric.color}`}>{metric.value}</div>
              <div className="mt-1 text-sm font-medium text-white">{metric.label}</div>
              <div className="text-xs text-slate-500">{metric.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
