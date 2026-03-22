import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { AlertTriangle, Smartphone, Wifi, BookOpen, Users, Ban } from "lucide-react";

function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }: {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const stepTime = Math.max(Math.floor(duration / end), 10);
    const increment = Math.max(Math.floor(end / (duration / stepTime)), 1);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

const STATS = [
  { value: 25.6, suffix: " Cr", label: "Illiterate Adults in India", sub: "Census 2011", icon: Users },
  { value: 44, suffix: "%", label: "Can't Use Smartphones", sub: "Rural India", icon: Smartphone },
  { value: 67, suffix: "%", label: "No Internet Access", sub: "Bottom 40% income", icon: Wifi },
  { value: 800, suffix: "+", label: "Govt Services Online", sub: "DigiLocker, UMANG, etc.", icon: BookOpen },
];

const BARRIERS = [
  {
    icon: BookOpen,
    title: "Reading Required",
    desc: "Every government app requires the ability to read forms, menus, and instructions in English or Hindi.",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: Smartphone,
    title: "Smartphone Needed",
    desc: "DigiLocker, UMANG, mParivahan — all require downloading apps on a smartphone with sufficient storage.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: Wifi,
    title: "Internet Dependent",
    desc: "Stable internet connectivity is required, which is often unavailable in rural and remote areas.",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    icon: Ban,
    title: "Exclusion by Design",
    desc: "The people who need government services the most — daily-wage workers, elderly, disabled — are excluded.",
    color: "from-red-600 to-red-800",
  },
];

export default function ProblemSection() {
  const { ref: sectionRef, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-950 py-24 sm:py-32"
      aria-label="The problem we are solving"
    >
      {/* Background accents */}
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
      <div className="absolute -left-40 top-1/2 h-[500px] w-[500px] rounded-full bg-red-500/3 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className={`text-center transition-all duration-700 ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">The Problem</span>
          </div>
          <h2 className="font-poppins text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Digital India is{" "}
            <span className="bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">
              Leaving Behind
            </span>{" "}
            Millions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Government services are going digital fast — but the people who need them most can't access them, so JanVaani pulls from official portals and government pages to explain the process in voice.
          </p>
        </div>

        {/* Stats grid */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center transition-all duration-500 hover:border-red-500/30 hover:bg-slate-900 ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${(i + 1) * 150}ms` }}
            >
              <stat.icon className="mx-auto mb-3 h-8 w-8 text-red-400/60 transition-colors group-hover:text-red-400" />
              <div className="font-poppins text-3xl font-bold text-white sm:text-4xl">
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix}
                  duration={2000 + i * 300}
                />
              </div>
              <div className="mt-2 text-sm font-medium text-slate-300">{stat.label}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Barrier cards */}
        <div className="mt-20">
          <h3
            className={`mb-10 text-center font-poppins text-2xl font-bold text-white transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            Three Barriers. One Excluded Population.
          </h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BARRIERS.map((barrier, i) => (
              <div
                key={barrier.title}
                className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-500 hover:border-slate-700 hover:-translate-y-1 ${
                  inView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${(i + 1) * 150 + 500}ms` }}
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${barrier.color} p-3 shadow-lg`}>
                  <barrier.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="mb-2 font-poppins text-lg font-bold text-white">{barrier.title}</h4>
                <p className="text-sm leading-relaxed text-slate-400">{barrier.desc}</p>
                {/* Hover glow */}
                <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-red-500/5 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Impactful quote */}
        <div
          className={`mt-16 rounded-2xl border border-red-500/10 bg-red-500/5 p-8 text-center transition-all duration-700 ${
            inView ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "1200ms" }}
        >
          <p className="font-poppins text-xl font-semibold italic text-slate-200 sm:text-2xl">
            "An illiterate daily-wage worker can't apply for a ration card online."
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Digital India must include <span className="font-semibold text-red-400">everyone</span> — not just those who can read and own smartphones.
          </p>
        </div>
      </div>
    </section>
  );
}
