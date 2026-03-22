import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  MapPin,
  Heart,
  Target,
  Award,
  ArrowRight,
} from "lucide-react";

function AnimatedCounter({ end, suffix = "", duration = 2500 }: {
  end: number;
  suffix?: string;
  duration?: number;
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
      {count.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

const IMPACT_METRICS = [
  {
    icon: Users,
    value: 25.6,
    suffix: " Cr",
    label: "Potential Beneficiaries",
    desc: "Illiterate adults who could access digital services",
    color: "text-saffron-light",
  },
  {
    icon: MapPin,
    value: 640,
    suffix: "+",
    label: "Districts Reachable",
    desc: "Anywhere there's a phone signal",
    color: "text-cyan-400",
  },
  {
    icon: Heart,
    value: 800,
    suffix: "+",
    label: "Govt Services",
    desc: "Accessible through voice interaction",
    color: "text-emerald-400",
  },
  {
    icon: TrendingUp,
    value: 22,
    suffix: "",
    label: "Indian Languages",
    desc: "Expandable through the current voice stack",
    color: "text-violet-400",
  },
];

const SDG_GOALS = [
  { num: 1, title: "No Poverty", desc: "Enable access to welfare schemes" },
  { num: 4, title: "Quality Education", desc: "Bridge the digital literacy gap" },
  { num: 10, title: "Reduced Inequalities", desc: "Inclusive digital access for all" },
  { num: 16, title: "Strong Institutions", desc: "Transparent government service delivery" },
];

export default function ImpactSection() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section
      id="impact"
      ref={ref}
      className="relative overflow-hidden bg-navy py-24 sm:py-32"
      aria-label="Impact and reach"
    >
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/3 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center transition-all duration-700 ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5">
            <Target className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Impact & Vision</span>
          </div>
          <h2 className="font-poppins text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Bridging the{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Digital Divide
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            JanVaani has the potential to transform how India's most vulnerable citizens interact with government services.
          </p>
        </div>

        {/* Impact metrics */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {IMPACT_METRICS.map((metric, i) => (
            <div
              key={metric.label}
              className={`group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center transition-all duration-500 hover:border-slate-700 hover:-translate-y-1 ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${(i + 1) * 150}ms` }}
            >
              <metric.icon className={`mx-auto h-8 w-8 ${metric.color} transition-transform group-hover:scale-110`} />
              <div className={`mt-3 font-poppins text-3xl font-black sm:text-4xl ${metric.color}`}>
                <AnimatedCounter end={metric.value} suffix={metric.suffix} />
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{metric.label}</div>
              <div className="mt-1 text-xs text-slate-500">{metric.desc}</div>
            </div>
          ))}
        </div>

        {/* SDG Goals */}
        <div className="mt-20">
          <h3
            className={`mb-10 text-center font-poppins text-2xl font-bold text-white transition-all duration-700 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            <Award className="mr-2 inline h-6 w-6 text-amber-400" />
            UN Sustainable Development Goals Alignment
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SDG_GOALS.map((goal, i) => (
              <div
                key={goal.num}
                className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-all duration-500 hover:border-slate-700 ${
                  inView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${800 + i * 150}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-poppins text-lg font-black text-white shadow-lg">
                    {goal.num}
                  </span>
                  <div>
                    <p className="font-poppins text-sm font-bold text-white">{goal.title}</p>
                    <p className="text-xs text-slate-400">{goal.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vision statement */}
        <div
          className={`mt-20 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-navy to-slate-900 transition-all duration-700 ${
            inView ? "animate-scale-in" : "opacity-0"
          }`}
          style={{ animationDelay: "1200ms" }}
        >
          <div className="relative p-8 sm:p-12">
            {/* Decorative background */}
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-saffron/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="relative text-center">
              <h3 className="font-poppins text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                Our Vision for{" "}
                <span className="gradient-text">Digital India</span>
              </h3>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
                A country where <span className="font-semibold text-white">every citizen</span> — regardless of literacy, language, or technology access — can exercise their right to government services through{" "}
                <span className="font-semibold text-saffron-light">the power of their voice</span>.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <p className="font-devanagari text-lg text-slate-400">
                  "सबका साथ, सबका विकास, <span className="font-semibold text-saffron-light">सबकी आवाज़</span>"
                </p>
                <span className="hidden h-4 w-px bg-slate-700 sm:block" />
                <p className="font-tamil text-lg text-slate-400">
                  "அனைவருக்கும் குரல், <span className="font-semibold text-emerald-400">அனைவருக்கும் அணுகல்</span>"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className={`mt-16 text-center transition-all duration-700 ${
            inView ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "1400ms" }}
        >
          <h3 className="font-poppins text-2xl font-bold text-white">Ready to Experience JanVaani?</h3>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            Try our live demo and experience how voice can bridge the digital divide.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#hero"
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-saffron to-saffron-light px-8 py-4 font-poppins text-lg font-bold text-white shadow-2xl shadow-saffron/25 transition-all hover:shadow-saffron/35 hover:brightness-110"
            >
              Try the Demo
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-slate-700 px-8 py-4 font-poppins text-lg font-semibold text-slate-300 transition-all hover:border-slate-500 hover:bg-white/5 hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
