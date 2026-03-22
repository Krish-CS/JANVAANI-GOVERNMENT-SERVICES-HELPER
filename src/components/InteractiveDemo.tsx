import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, MousePointer2, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import type { InteractiveStep } from "../utils/api";

interface InteractiveDemoProps {
  steps: InteractiveStep[];
  language: "en" | "hi" | "ta";
  onClose?: () => void;
}

export default function InteractiveDemo({ steps, language, onClose }: InteractiveDemoProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getText = (en: string, hi: string, ta: string) => {
    if (language === "hi") return hi;
    if (language === "ta") return ta;
    return en;
  };

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const baseUrl = steps[0]?.page_url || "https://uidai.gov.in";

  // Animate cursor to target position when step changes
  useEffect(() => {
    if (!currentStep) return;
    
    setIsAnimating(true);

    const targetPositions: Record<string, { x: number; y: number }> = {
      "body": { x: 50, y: 30 },
      ".my-aadhaar-menu": { x: 30, y: 20 },
      ".enrolment-link": { x: 50, y: 50 },
      "#state-dropdown": { x: 40, y: 40 },
      ".book-appointment-btn": { x: 60, y: 70 },
      ".ration-card-link": { x: 35, y: 30 },
      ".new-application-btn": { x: 50, y: 50 },
      "#family-details": { x: 50, y: 50 },
      ".upload-section": { x: 50, y: 60 },
      ".submit-btn": { x: 70, y: 80 },
      ".new-pan-btn": { x: 50, y: 40 },
      "#personal-details": { x: 50, y: 50 },
      ".pay-btn": { x: 60, y: 75 },
      ".form6-link": { x: 45, y: 35 },
      "#state-select": { x: 40, y: 40 },
      "#form6-details": { x: 50, y: 50 },
      ".upload-area": { x: 50, y: 55 },
      ".farmer-corner-link": { x: 40, y: 35 },
      "#aadhaar-input": { x: 50, y: 45 },
      "#registration-form": { x: 50, y: 50 },
      ".register-btn": { x: 60, y: 70 },
      ".fresh-passport-btn": { x: 50, y: 45 },
      ".pay-book-btn": { x: 60, y: 75 },
      ".new-ration-card-btn": { x: 50, y: 50 },
    };

    const target = targetPositions[currentStep.highlight_element] || { x: 50, y: 50 };
    const duration = 800;
    const startX = cursorPosition.x;
    const startY = cursorPosition.y;
    const startTime = Date.now();

    const animateCursor = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      setCursorPosition({
        x: startX + (target.x - startX) * eased,
        y: startY + (target.y - startY) * eased,
      });

      if (progress < 1) {
        requestAnimationFrame(animateCursor);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animateCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex]);

  const goToNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      if (iframeRef.current && steps[currentStepIndex + 1]?.page_url) {
        setIsLoading(true);
        iframeRef.current.src = steps[currentStepIndex + 1].page_url;
      }
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      if (iframeRef.current && steps[currentStepIndex - 1]?.page_url) {
        setIsLoading(true);
        iframeRef.current.src = steps[currentStepIndex - 1].page_url;
      }
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!currentStep) return null;

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-[200]" : "w-full"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {language === "hi" ? "🌐 इंटरएक्टिव वेबसाइट डेमो" : language === "ta" ? "🌐 இணையதள டெமோ" : "🌐 Interactive Website Demo"}
          </h3>
          <p className="text-sm text-slate-400">
            {language === "hi" ? "असली वेबसाइट पर क्लिक करके सीखें" : language === "ta" ? "உண்மையான இணையதளத்தில் கிளிக் செய்து கற்றுக்கொள்ளுங்கள்" : "Learn by clicking on the real website"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={currentStep.page_url} target="_blank" rel="noopener noreferrer" className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors" title="Open in new tab">
            <ExternalLink className="h-5 w-5" />
          </a>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-white transition-colors">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Browser Frame with Real Website */}
      <div className={`relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 ${isFullscreen ? "h-[calc(100vh-200px)]" : "h-[600px]"}`}>
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-slate-400">
            <span className="text-emerald-400">🔒</span>
            <span className="truncate">{currentStep.page_url}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-lg">
            <span className="text-xs text-violet-400 font-medium">
              {language === "hi" ? "चरण" : language === "ta" ? "படி" : "Step"} {currentStepIndex + 1}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Real Website in Iframe with Cursor Overlay */}
        <div className="relative w-full h-full bg-white">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-40">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-600">Loading website...</p>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={baseUrl}
            title={currentStep.page_title}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />

          {/* Cursor Overlay Layer */}
          <div className="absolute inset-0 pointer-events-none z-30">
            <div
              className="absolute transition-all duration-100"
              style={{
                left: `${cursorPosition.x}%`,
                top: `${cursorPosition.y}%`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            >
              <div className="relative">
                <MousePointer2 className={`h-8 w-8 drop-shadow-lg ${isAnimating ? "text-violet-500" : "text-slate-800"}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
                {isAnimating && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-violet-400/30 animate-ping" />
                    <div className="absolute -inset-2 rounded-full border-2 border-violet-400/50 animate-pulse" />
                  </>
                )}
                {!isAnimating && currentStep.action_type === "click" && (
                  <div className="absolute inset-0 rounded-full border-2 border-violet-400 animate-ping" />
                )}
              </div>
            </div>
            {isAnimating && (
              <div
                className="absolute border-2 border-violet-500 bg-violet-500/10 rounded-lg animate-pulse"
                style={{
                  left: `${cursorPosition.x - 10}%`,
                  top: `${cursorPosition.y - 10}%`,
                  width: "20%",
                  height: "20%",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentStepIndex(index);
                  if (iframeRef.current && steps[index]?.page_url) {
                    setIsLoading(true);
                    iframeRef.current.src = steps[index].page_url;
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all ${index === currentStepIndex ? "w-6 bg-violet-400" : index < currentStepIndex ? "bg-violet-400/50" : "bg-slate-600"}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevStep} disabled={currentStepIndex === 0} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-4 w-4" />
            {language === "hi" ? "पिछला" : language === "ta" ? "முந்தைய" : "Previous"}
          </button>
          <button onClick={goToNextStep} disabled={currentStepIndex === totalSteps - 1} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {language === "hi" ? "अगला" : language === "ta" ? "அடுத்த" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Current step instruction */}
      <div className="mt-3 p-3 rounded-lg bg-violet-500/10 border border-violet-400/20">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-sm">
            {currentStep.step_number}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-400 mb-1">
              {getText(currentStep.title, currentStep.title_hi, currentStep.title_ta)}
            </p>
            <p className="text-sm text-slate-300">
              {getText(currentStep.description, currentStep.description_hi, currentStep.description_ta)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
