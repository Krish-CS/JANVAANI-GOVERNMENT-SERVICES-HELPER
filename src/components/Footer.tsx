import { Phone, Heart, ExternalLink } from "lucide-react";

const TECH_LINKS = [
  { name: "Groq", url: "https://console.groq.com" },
  { name: "Cerebras", url: "https://cloud.cerebras.ai" },
  { name: "Azure Speech", url: "https://azure.microsoft.com/products/ai-services/ai-speech/" },
];

const PROJECT_LINKS = [
  { name: "Problem Statement", href: "#problem" },
  { name: "Our Solution", href: "#solution" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Architecture", href: "#architecture" },
  { name: "Impact", href: "#impact" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-800 bg-slate-950 py-16" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-saffron-light">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-poppins text-lg font-bold text-white">JanVaani</span>
                <p className="font-devanagari text-xs text-slate-500">जनवाणी — People's Voice</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              A source-grounded speech-to-speech assistant enabling inclusive access to Digital India — combining official web sources, curated service data, and multilingual voice support for every citizen.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Open Source
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-saffron/10 px-2.5 py-1 text-saffron-light">
                Made for India 🇮🇳
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-poppins text-sm font-bold uppercase tracking-wider text-slate-300">Project</h4>
            <ul className="mt-4 space-y-3">
              {PROJECT_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="font-poppins text-sm font-bold uppercase tracking-wider text-slate-300">
              Powered By
            </h4>
            <ul className="mt-4 space-y-3">
              {TECH_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              Built for Hackathon 2025 • Inclusive Digital Transformation Track
            </p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              Made with <Heart className="h-3 w-3 fill-red-500 text-red-500" /> for India
            </p>
          </div>
        </div>

        {/* India flag gradient */}
        <div className="mt-8 flex h-1 overflow-hidden rounded-full">
          <div className="flex-1 bg-gradient-to-r from-saffron to-saffron-light" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-gradient-to-r from-india-green to-emerald-600" />
        </div>
      </div>
    </footer>
  );
}
