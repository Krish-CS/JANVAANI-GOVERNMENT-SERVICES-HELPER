import { useEffect, useRef } from "react";
import { ArrowDown, Sparkles, Globe, Shield } from "lucide-react";

function VoiceWaveform() {
  return (
    <div className="flex items-center justify-center gap-1" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="wave-bar w-1 rounded-full bg-gradient-to-t from-saffron to-saffron-light"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

function FloatingParticle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full opacity-20"
      style={{
        ...style,
        animation: `particle-float ${8 + Math.random() * 6}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 4}s`,
      }}
    />
  );
}

export default function HeroSection({ onDemoClick }: { onDemoClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 53, ${p.o})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 107, 53, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      aria-label="JanVaani hero section"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-navy to-slate-950" />
      <div className="hero-grid absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Radial glow */}
      <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-saffron/5 blur-[120px]" />
      <div className="absolute right-1/4 top-2/3 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />

      {/* Floating decorative particles */}
      <FloatingParticle style={{ top: "15%", left: "10%", width: 6, height: 6, background: "#FF6B35" }} />
      <FloatingParticle style={{ top: "70%", right: "15%", width: 8, height: 8, background: "#06b6d4" }} />
      <FloatingParticle style={{ top: "40%", right: "8%", width: 4, height: 4, background: "#10b981" }} />
      <FloatingParticle style={{ bottom: "25%", left: "20%", width: 5, height: 5, background: "#8b5cf6" }} />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-32 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-saffron/20 bg-saffron/10 px-5 py-2">
          <Sparkles className="h-4 w-4 text-saffron" />
          <span className="text-sm font-medium text-saffron-light">
            Inclusive Digital Transformation
          </span>
        </div>

        {/* Main heading */}
        <h1 className="animate-fade-in-up animation-delay-100 font-poppins text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-8xl">
          <span className="text-white">Jan</span>
          <span className="gradient-text text-shadow-glow">Vaani</span>
        </h1>

        {/* Hindi/Tamil subtitle */}
        <div className="animate-fade-in-up animation-delay-200 mt-4 flex items-center justify-center gap-4">
          <span className="font-devanagari text-xl font-semibold text-slate-300 sm:text-2xl">
            जनवाणी
          </span>
          <span className="h-5 w-px bg-slate-600" />
          <span className="font-tamil text-xl font-semibold text-slate-300 sm:text-2xl">
            ஜனவாணி
          </span>
          <span className="h-5 w-px bg-slate-600" />
          <span className="text-xl font-semibold text-slate-300 sm:text-2xl">People's Voice</span>
        </div>

        {/* Description */}
        <p className="animate-fade-in-up animation-delay-300 mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-400 sm:text-xl">
          AI-powered speech-to-speech assistant that lets{" "}
          <span className="font-semibold text-white">every citizen</span> access government
          digital services — with answers grounded in official web sources, government pages, and curated service data.
          <span className="text-saffron-light"> no smartphone</span>,{" "}
          <span className="text-cyan-400">no internet</span>,{" "}
          <span className="text-emerald-400">no reading</span> needed.
        </p>

        <p className="animate-fade-in-up animation-delay-350 mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
          JanVaani fetches guides, portal cues, and service details from official web sources first, then combines them with curated service records so the guidance stays practical and current.
        </p>

        {/* Voice waveform */}
        <div className="animate-fade-in-up animation-delay-400 mx-auto mt-10 flex items-center justify-center gap-6">
          <VoiceWaveform />
          <span className="text-sm font-medium text-slate-500">
            Just speak — JanVaani listens
          </span>
          <VoiceWaveform />
        </div>

        {/* CTAs */}
        <div className="animate-fade-in-up animation-delay-500 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={onDemoClick}
            className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-saffron to-saffron-light px-8 py-4 font-poppins text-lg font-bold text-white shadow-2xl shadow-saffron/30 transition-all hover:shadow-saffron/40 hover:brightness-110 active:scale-95"
          >
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              🎤
            </span>
            <span className="relative">Try Live Demo</span>
          </button>
          <a
            href="#how-it-works"
            className="group flex items-center gap-2 rounded-2xl border border-slate-700 px-8 py-4 font-poppins text-lg font-semibold text-slate-300 transition-all hover:border-slate-500 hover:bg-white/5 hover:text-white"
          >
            See How It Works
            <ArrowDown className="h-5 w-5 transition-transform group-hover:translate-y-1" />
          </a>
        </div>

        {/* Feature pills */}
        <div className="animate-fade-in-up animation-delay-600 mt-16 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {[
            { icon: Globe, text: "Hindi • Tamil • English", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
            { icon: Shield, text: "100% Free & Open", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
            { icon: Sparkles, text: "Official web sources + live guides", color: "text-saffron-light bg-saffron/10 border-saffron/20" },
          ].map((pill) => (
            <div
              key={pill.text}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${pill.color}`}
            >
              <pill.icon className="h-4 w-4" />
              {pill.text}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-5 w-5 text-slate-500" />
      </div>
    </section>
  );
}
