import { useState } from "react";
import { BookOpen, FileText, Clock, IndianRupee, Phone, Mail, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { Guide } from "../utils/api";

interface GuideViewerProps {
  guide: Guide;
  language: "en" | "hi" | "ta";
  onClose?: () => void;
}

export default function GuideViewer({ guide, language, onClose }: GuideViewerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1, 2, 3]));

  const getText = (en: string, hi: string, ta: string) => {
    if (language === "hi") return hi;
    if (language === "ta") return ta;
    return en;
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const documents = getText(
    guide.required_documents,
    guide.required_documents_hi,
    guide.required_documents_ta
  );

  const eligibility = getText(guide.eligibility, guide.eligibility_hi, guide.eligibility_ta);
  const processingTime = getText(guide.processing_time, guide.processing_time_hi, guide.processing_time_ta);
  const fees = getText(guide.fees, guide.fees_hi, guide.fees_ta);
  const availabilityStep = guide.steps.find((step) => step.step_number === 1);
  const availabilityText = availabilityStep
    ? getText(availabilityStep.description, availabilityStep.description_hi, availabilityStep.description_ta)
    : "";
  const hasLimitedOrUnknownAvailability =
    availabilityText.toLowerCase().includes("may not be fully available online") ||
    availabilityText.toLowerCase().includes("not available") ||
    availabilityText.toLowerCase().includes("partial online") ||
    availabilityText.toLowerCase().includes("could not confirm") ||
    availabilityText.includes("पूरी तरह ऑनलाइन उपलब्ध नहीं") ||
    availabilityText.includes("पुष्टि नहीं") ||
    availabilityText.includes("முழுமையாக ஆன்லைனில் கிடைக்காமல்");

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {getText(guide.service_name, guide.service_name_hi, guide.service_name_ta)}
            </h2>
            <p className="text-sm text-slate-400">
              {guide.department} • {guide.category}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-slate-600/60 bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
          {language === "hi"
            ? "यह गाइड केवल जानकारी के लिए है। आवेदन/भुगतान हमेशा आधिकारिक वेबसाइट पर ही करें।"
            : language === "ta"
            ? "இந்த வழிகாட்டி தகவலுக்காக மட்டுமே. விண்ணப்பம்/கட்டணம் எப்போதும் அதிகாரப்பூர்வ தளத்தில் செய்யவும்."
            : "This guide is read-only advisory content. Always submit applications and payments on the official government website."}
        </div>

        <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100/90">
          {language === "hi"
            ? "स्रोत: आधिकारिक वेबसाइटें, स्क्रैप किए गए सरकारी पेज और क्यूरेटेड सेवा डेटा."
            : language === "ta"
            ? "மூலம்: அதிகாரப்பூர்வ இணையதளங்கள், ஸ்க்ரேப் செய்யப்பட்ட அரசு பக்கங்கள் மற்றும் க்யூரேட் செய்யப்பட்ட சேவை தரவு."
            : "Source: official websites, scraped government pages, and curated service data."}
        </div>

        {/* Quick info */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>{processingTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <IndianRupee className="h-4 w-4 text-emerald-400" />
            <span>{fees}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Phone className="h-4 w-4 text-saffron-light" />
            <span>{guide.helpline}</span>
          </div>
        </div>

        {availabilityText && (
          <div
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              hasLimitedOrUnknownAvailability
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            <span className="font-semibold">
              {language === "hi"
                ? "उपलब्धता स्थिति: "
                : language === "ta"
                ? "கிடைப்புத் நிலை: "
                : "Availability Status: "}
            </span>
            {availabilityText}
          </div>
        )}

        {/* Official website link */}
        <a
          href={guide.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {new URL(guide.official_url).hostname}
        </a>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">
            {language === "hi" ? "आवेदन कैसे करें" : language === "ta" ? "எப்படி விண்ணப்பிப்பது" : "How to Apply"}
          </h3>
        </div>

        <div className="space-y-3">
          {guide.steps.map((step) => {
            const isExpanded = expandedSteps.has(step.step_number);
            const description = getText(step.description, step.description_hi, step.description_ta);

            return (
              <div
                key={step.step_number}
                className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden transition-all hover:border-slate-600"
              >
                <button
                  onClick={() => toggleStep(step.step_number)}
                  className="w-full flex items-start justify-between p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 min-w-10 aspect-square shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold text-sm leading-none shadow-[0_0_0_1px_rgba(34,211,238,0.25)]">
                      {step.step_number}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {getText(step.title, step.title_hi, step.title_ta)}
                      </p>
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pl-14">
                    <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Required Documents */}
      <div className="mb-8 rounded-xl border border-amber-400/20 bg-amber-400/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">
            {language === "hi" ? "आवश्यक दस्तावेज़" : language === "ta" ? "தேவையான ஆவணங்கள்" : "Required Documents"}
          </h3>
        </div>

        <ul className="space-y-2">
          {documents.map((doc, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Eligibility */}
      <div className="mb-8 rounded-xl border border-violet-400/20 bg-violet-400/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-violet-400" />
          <h3 className="text-lg font-bold text-white">
            {language === "hi" ? "पात्रता" : language === "ta" ? "தகுதி" : "Eligibility"}
          </h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{eligibility}</p>
      </div>

      {/* Contact Info */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-saffron-light" />
          <h3 className="text-lg font-bold text-white">
            {language === "hi" ? "संपर्क जानकारी" : language === "ta" ? "தொடர்பு தகவல்" : "Contact Information"}
          </h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="h-4 w-4 text-slate-500" />
            <span>Helpline: <span className="text-white font-medium">{guide.helpline}</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Mail className="h-4 w-4 text-slate-500" />
            <span>Email: <a href={`mailto:${guide.email}`} className="text-cyan-400 hover:underline">{guide.email}</a></span>
          </div>
          {guide.contact_note && (
            <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-3 leading-relaxed text-slate-300">
              {getText(
                guide.contact_note,
                guide.contact_note_hi || guide.contact_note,
                guide.contact_note_ta || guide.contact_note
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
