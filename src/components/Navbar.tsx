import { useState, useEffect, useCallback } from "react";
import { Menu, X, Phone, Volume2 } from "lucide-react";

const NAV_LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "Solution", href: "#solution" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Architecture", href: "#architecture" },
  { label: "Impact", href: "#impact" },
];

export default function Navbar({ onDemoClick }: { onDemoClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-dark py-3 shadow-2xl shadow-black/20"
          : "bg-transparent py-5"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-saffron-light shadow-lg shadow-saffron/20 transition-transform group-hover:scale-110">
              <Phone className="h-5 w-5 text-white" strokeWidth={2.5} />
              <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-poppins text-lg font-bold leading-tight tracking-tight text-white">
                JanVaani
              </span>
              <span className="font-devanagari text-[10px] font-medium leading-tight text-slate-400">
                जनवाणी — People's Voice
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onDemoClick}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-saffron to-saffron-light px-5 py-2.5 font-poppins text-sm font-semibold text-white shadow-lg shadow-saffron/25 transition-all hover:shadow-xl hover:shadow-saffron/30 hover:brightness-110 active:scale-95"
            >
              <Volume2 className="h-4 w-4 transition-transform group-hover:scale-110" />
              Try Live Demo
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            menuOpen ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="glass rounded-2xl p-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                onDemoClick();
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron to-saffron-light px-5 py-3 font-poppins text-sm font-semibold text-white"
            >
              <Volume2 className="h-4 w-4" />
              Try Live Demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
