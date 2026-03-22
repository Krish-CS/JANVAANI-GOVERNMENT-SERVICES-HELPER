import { useInView } from "react-intersection-observer";
import {
  Phone,
  Mic,
  MessageSquare,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Globe,
  ShieldCheck,
  IndianRupee,
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Phone,
    title: "Dial or Open",
    titleHi: "कॉल करें",
    titleTa: "அழைக்கவும்",
    desc: "User calls JanVaani or opens the web app. No login, no registration needed.",
    color: "from-cyan-400 to-blue-500",
    glow: "cyan",
  },
  {
    num: "02",
    icon: Mic,
    title: "Speak Naturally",
    titleHi: "बोलें",
    titleTa: "பேசுங்கள்",
    desc: "\"मुझे राशन कार्ड बनवाना है\" — Speak in Hindi, Tamil, or English. JanVaani understands.",
    color: "from-saffron to-saffron-light",
    glow: "saffron",
  },
  {
    num: "03",
    icon: MessageSquare,
    title: "AI Processes",
    titleHi: "AI समझता है",
    titleTa: "AI புரிந்துகொள்ளும்",
    desc: "AI converts speech to text, understands intent, extracts info, and generates response — all in your language.",
    color: "from-violet-500 to-purple-600",
    glow: "purple",
  },
  {
    num: "04",
    icon: Volume2,
    title: "Hear Response",
    titleHi: "जवाब सुनें",
    titleTa: "பதிலைக் கேளுங்கள்",
    desc: "JanVaani speaks back in the user's language. Guided step-by-step through the entire government process.",
    color: "from-emerald-400 to-green-600",
    glow: "green",
  },
];

const SERVICES = [
  "Ration Card Application",
  "Aadhaar Update",
  "PM Kisan Registration",
  "Pension Scheme Enrollment",
  "Birth/Death Certificate",
  "Caste Certificate",
  "Land Record Query",
  "Ayushman Bharat Card",
  "Voter ID Registration",
  "MGNREGA Job Card",
  "PM Awas Yojana",
  "e-Shram Registration",
];

export default function SolutionSection() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section
      id="solution"
      ref={ref}
      className="relative overflow-hidden bg-navy py-24 sm:py-32"
      aria-label="Our solution"
    >
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-saffron/30 to-transparent" />
      <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-saffron/3 blur-[120px]" />
      <div className="absolute -left-20 bottom-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/3 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center transition-all duration-700 ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-saffron/20 bg-saffron/10 px-4 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-saffron" />
            <span className="text-sm font-medium text-saffron-light">The Solution</span>
          </div>
          <h2 className="font-poppins text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Meet{" "}
            <span className="gradient-text text-shadow-glow">JanVaani</span>
          </h2>
          <p className="mt-2 font-devanagari text-xl text-slate-400">
            जनवाणी — People's Voice
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-400">
            A phone-call-based AI assistant that lets illiterate citizens access{" "}
            <span className="font-semibold text-white">any</span> government digital service through{" "}
            <span className="font-semibold text-saffron-light">voice alone</span>, backed by official portals, government pages, and curated service data.
          </p>
        </div>

        {/* Key value props */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Phone, title: "No Smartphone Needed", desc: "Works with any basic phone via voice call", color: "text-cyan-400 border-cyan-400/20 bg-cyan-400/5" },
            { icon: Globe, title: "Multilingual", desc: "Hindi, Tamil, English — and growing", color: "text-saffron-light border-saffron/20 bg-saffron/5" },
              { icon: IndianRupee, title: "Source-Grounded", desc: "Uses official portals, government pages, and curated service records", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
          ].map((prop, i) => (
            <div
              key={prop.title}
              className={`flex items-center gap-4 rounded-2xl border p-5 transition-all duration-500 ${prop.color} ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${(i + 1) * 150}ms` }}
            >
              <prop.icon className="h-8 w-8 shrink-0" />
              <div>
                <h3 className="font-poppins font-bold text-white">{prop.title}</h3>
                <p className="text-sm text-slate-400">{prop.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works steps */}
        <div className="mt-20">
          <h3
            className={`mb-12 text-center font-poppins text-2xl font-bold text-white transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            How a Conversation Works
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-500 hover:border-slate-700 hover:-translate-y-1 ${
                  inView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${(i + 1) * 200 + 300}ms` }}
              >
                {/* Step number */}
                <span className="font-poppins text-5xl font-black text-slate-800/50 transition-colors group-hover:text-slate-700/50">
                  {step.num}
                </span>

                {/* Icon */}
                <div className={`mt-3 inline-flex rounded-xl bg-gradient-to-br ${step.color} p-3 shadow-lg transition-transform group-hover:scale-110`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>

                {/* Text */}
                <h4 className="mt-4 font-poppins text-lg font-bold text-white">{step.title}</h4>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-devanagari">{step.titleHi}</span>
                  <span>•</span>
                  <span className="font-tamil">{step.titleTa}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.desc}</p>

                {/* Arrow connector (not on last) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <ArrowRight className="h-6 w-6 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Example conversation */}
        <div
          className={`mt-20 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 transition-all duration-700 ${
            inView ? "animate-scale-in" : "opacity-0"
          }`}
          style={{ animationDelay: "800ms" }}
        >
          <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-sm font-medium text-slate-400">JanVaani — Example Conversation (Tamil)</span>
            </div>
          </div>
          <div className="space-y-4 p-6">
            {[
              { role: "user", text: "🗣️ \"எனக்கு ரேஷன் கார்டு வேணும்\"", sub: "(I need a ration card)", align: "justify-end" },
              { role: "ai", text: "🤖 \"உங்கள் பெயர் என்ன?\"", sub: "(What is your name?)", align: "justify-start" },
              { role: "user", text: "🗣️ \"என் பெயர் முருகன்\"", sub: "(My name is Murugan)", align: "justify-end" },
              { role: "ai", text: "🤖 \"முருகன், உங்கள் ஆதார் எண் சொல்லுங்கள்\"", sub: "(Murugan, please tell your Aadhaar number)", align: "justify-start" },
            ].map((msg, i) => (
              <div key={i} className={`flex ${msg.align}`}>
                <div
                  className={`max-w-md rounded-2xl px-5 py-3 ${
                    msg.role === "user"
                      ? "rounded-br-md bg-saffron/10 border border-saffron/20"
                      : "rounded-bl-md bg-cyan-500/10 border border-cyan-500/20"
                  }`}
                >
                  <p className="font-tamil text-sm font-medium text-white">{msg.text}</p>
                  <p className="mt-1 text-xs text-slate-500">{msg.sub}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Total round-trip: ~1.5 seconds per exchange
            </div>
          </div>
        </div>

        {/* Services grid */}
        <div className="mt-20">
          <h3
            className={`mb-8 text-center font-poppins text-2xl font-bold text-white transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            Government Services Accessible via Voice
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {SERVICES.map((service, i) => (
              <div
                key={service}
                className={`rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-all hover:border-saffron/30 hover:bg-saffron/5 hover:text-white ${
                  inView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${1000 + i * 80}ms` }}
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
