"""
JanVaani — Guide Generator Service
Combines scraped web data + curated database + LLM to generate
comprehensive step-by-step guides for government services.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Literal

from backend.data.government_services import (
    get_service,
    search_services,
    get_all_services,
    GovernmentService,
    InteractiveStep,
)
from backend.services.web_scraper import get_scraper_service
from backend.services.llm import get_llm_service

logger = logging.getLogger("janvaani.guide")


@dataclass
class GuideStep:
    """A single step in a guide."""
    step_number: int
    title: str
    title_hi: str
    title_ta: str
    description: str
    description_hi: str
    description_ta: str
    tips: list[str] = field(default_factory=list)
    tips_hi: list[str] = field(default_factory=list)
    tips_ta: list[str] = field(default_factory=list)


@dataclass
class GeneratedGuide:
    """A complete guide for a government service."""
    service_id: str
    service_name: str
    service_name_hi: str
    service_name_ta: str
    category: str
    official_url: str
    department: str
    # Steps
    steps: list[GuideStep]
    # Documents
    required_documents: list[str]
    required_documents_hi: list[str]
    required_documents_ta: list[str]
    # Eligibility
    eligibility: str
    eligibility_hi: str
    eligibility_ta: str
    # Processing info
    processing_time: str
    processing_time_hi: str
    processing_time_ta: str
    fees: str
    fees_hi: str
    fees_ta: str
    # Contact
    helpline: str
    email: str
    # Interactive walkthrough
    interactive_steps: list[dict]
    # Source info
    source_url: str
    scraped_content: str | None = None
    contact_note: str = ""
    contact_note_hi: str = ""
    contact_note_ta: str = ""
    # YouTube keywords
    youtube_keywords: dict[str, str] = field(default_factory=dict)


class GuideGeneratorService:
    """Generates comprehensive guides for government services."""

    def __init__(self):
        logger.info("✅ Guide Generator Service initialized")

    @property
    def is_available(self) -> bool:
        return True

    async def generate_guide(
        self,
        service_id: str,
        language: str = "en",
        include_web_content: bool = True,
    ) -> GeneratedGuide | None:
        """
        Generate a comprehensive guide for a service.

        Args:
            service_id: Service ID (e.g., "aadhaar", "pan_card")
            language: Language for the guide
            include_web_content: Whether to scrape latest web content

        Returns:
            GeneratedGuide or None if service not found
        """
        # Get service from database
        service = get_service(service_id)
        if not service:
            logger.warning("⚠️ Service not found: %s", service_id)
            return None

        logger.info("📋 Generating guide for: %s", service.name)

        # Scrape latest content from official website
        scraped_content = None
        availability_source_url = service.official_url
        if include_web_content:
            scraper = get_scraper_service()
            scraped = await scraper.scrape_url(service.official_url)
            if scraped.success and scraped.content:
                scraped_content = scraped.content
                availability_source_url = scraped.url or service.official_url
                logger.info("✅ Scraped content from: %s", service.official_url)

            # Try to find a more specific service page from the same official department.
            searched = await scraper.search_service_page(service.name, service.department)
            if searched and searched.success and searched.content and len(searched.content) > len(scraped_content or ""):
                scraped_content = searched.content
                availability_source_url = searched.url or availability_source_url

        # Convert interactive steps to dict format
        interactive_steps_dict = []
        for step in service.interactive_steps:
            interactive_steps_dict.append({
                "step_number": step.step_number,
                "title": step.title,
                "title_hi": step.title_hi,
                "title_ta": step.title_ta,
                "description": step.description,
                "description_hi": step.description_hi,
                "description_ta": step.description_ta,
                "page_title": step.page_title,
                "page_url": step.page_url,
                "highlight_element": step.highlight_element,
                "action_type": step.action_type,
                "input_value": step.input_value,
            })

        # Build all derived content once so guide fields and generated steps stay consistent.
        status, availability_en, availability_hi, availability_ta = self._determine_online_availability(scraped_content)
        documents, documents_hi, documents_ta = self._enrich_documents(service, scraped_content)
        eligibility_en, eligibility_hi, eligibility_ta = self._enrich_eligibility(
            service,
            scraped_content,
            status,
            availability_en,
            availability_hi,
            availability_ta,
        )
        contact_en, contact_hi, contact_ta = self._build_contact_summary(
            service,
            status,
            availability_en,
            availability_hi,
            availability_ta,
        )

        # Create guide from curated data
        guide = GeneratedGuide(
            service_id=service.id,
            service_name=service.name,
            service_name_hi=service.name_hi,
            service_name_ta=service.name_ta,
            category=service.category,
            official_url=service.official_url,
            department=service.department,
            steps=self._create_guide_steps(
                service,
                scraped_content,
                availability_source_url,
                status,
                availability_en,
                availability_hi,
                availability_ta,
            ),
            required_documents=documents,
            required_documents_hi=documents_hi,
            required_documents_ta=documents_ta,
            eligibility=eligibility_en,
            eligibility_hi=eligibility_hi,
            eligibility_ta=eligibility_ta,
            processing_time=service.processing_time,
            processing_time_hi=service.processing_time_hi,
            processing_time_ta=service.processing_time_ta,
            fees=service.fees,
            fees_hi=service.fees_hi,
            fees_ta=service.fees_ta,
            helpline=service.helpline,
            email=service.email,
            contact_note=contact_en,
            contact_note_hi=contact_hi,
            contact_note_ta=contact_ta,
            interactive_steps=interactive_steps_dict,
            source_url=service.official_url,
            scraped_content=scraped_content,
            youtube_keywords=service.youtube_keywords,
        )

        logger.info("✅ Guide generated: %s (%d steps)",
                   service.name, len(guide.steps))

        return guide

    def _determine_online_availability(
        self,
        scraped_content: str | None,
    ) -> tuple[str, str, str, str]:
        """Infer online availability from scraped official page text.

        Returns: (status, english_msg, hindi_msg, tamil_msg)
        status: online | limited | unknown
        """
        if not scraped_content:
            return (
                "unknown",
                "Could not confirm online availability from the official page content. Use the official portal link and helpline to verify before proceeding.",
                "आधिकारिक पेज के कंटेंट से ऑनलाइन उपलब्धता की पुष्टि नहीं हो सकी। आगे बढ़ने से पहले आधिकारिक पोर्टल लिंक और हेल्पलाइन से सत्यापित करें।",
                "அதிகாரப்பூர்வ பக்க உள்ளடக்கத்தில் இருந்து ஆன்லைன் கிடைப்பை உறுதிப்படுத்த முடியவில்லை. தொடர்வதற்கு முன் அதிகாரப்பூர்வ தள இணைப்பு மற்றும் உதவி எண்ணில் சரிபார்க்கவும்.",
            )

        text = re.sub(r"\s+", " ", scraped_content.lower())

        # UIDAI-specific official evidence: the My Aadhaar page exposes Update Your Aadhaar,
        # Document update, and Update Demographics Data & Check Status entries.
        if (
            "update your aadhaar" in text
            and ("document update" in text or "update demographics data" in text)
        ):
            return (
                "online",
                "UIDAI official content shows Update Your Aadhaar and Document update options. Name update can be checked and processed through the official myAadhaar workflow when the portal permits it.",
                "UIDAI की आधिकारिक सामग्री में Update Your Aadhaar और Document update विकल्प दिखते हैं। नाम अपडेट आधिकारिक myAadhaar प्रक्रिया से जाँचा और किया जा सकता है, जब पोर्टल इसकी अनुमति दे।",
                "UIDAI அதிகாரப்பூர்வ உள்ளடக்கத்தில் Update Your Aadhaar மற்றும் Document update விருப்பங்கள் உள்ளன. பெயர் புதுப்பிப்பை அதிகாரப்பூர்வ myAadhaar செயல்முறை வழியாக, தளம் அனுமதிக்கும் போது, சரிபார்த்து செய்யலாம்.",
            )

        online_positive = [
            "apply online",
            "online application",
            "apply now",
            "e-service",
            "eservice",
            "register online",
            "book appointment online",
            "submit online",
            "online portal",
        ]
        online_negative = [
            "visit nearest office",
            "visit office",
            "offline application",
            "in person",
            "not available online",
            "manual submission",
            "apply through csc",
        ]

        positive_hits = sum(1 for phrase in online_positive if phrase in text)
        negative_hits = sum(1 for phrase in online_negative if phrase in text)

        if positive_hits > 0 and negative_hits == 0:
            return (
                "online",
                "Official content indicates this service is available online. Use the official portal first.",
                "आधिकारिक सामग्री के अनुसार यह सेवा ऑनलाइन उपलब्ध है। पहले आधिकारिक पोर्टल का उपयोग करें।",
                "அதிகாரப்பூர்வ உள்ளடக்கத்தின் படி இந்த சேவை ஆன்லைனில் கிடைக்கிறது. முதலில் அதிகாரப்பூர்வ தளத்தை பயன்படுத்தவும்.",
            )

        if negative_hits > 0 and positive_hits == 0:
            return (
                "limited",
                "Official content indicates full online application is not available. Follow the manual/office process listed below.",
                "आधिकारिक सामग्री के अनुसार पूर्ण ऑनलाइन आवेदन उपलब्ध नहीं है। नीचे दिए गए मैनुअल/ऑफिस चरणों का पालन करें।",
                "அதிகாரப்பூர்வ உள்ளடக்கத்தின் படி முழு ஆன்லைன் விண்ணப்பம் கிடைக்கவில்லை. கீழே உள்ள கையேடு/அலுவலக படிகளைப் பின்பற்றவும்.",
            )

        if positive_hits > 0 and negative_hits > 0:
            return (
                "limited",
                "Official content shows partial online availability. Start online first, and use office/manual steps where the portal requires it.",
                "आधिकारिक सामग्री में आंशिक ऑनलाइन उपलब्धता दिखती है। पहले ऑनलाइन शुरू करें, और जहां पोर्टल कहे वहां ऑफिस/मैनुअल चरण करें।",
                "அதிகாரப்பூர்வ உள்ளடக்கம் பகுதியளவு ஆன்லைன் கிடைப்பை காட்டுகிறது. முதலில் ஆன்லைனில் தொடங்குங்கள்; தளம் கூறும் இடங்களில் அலுவலக/கையேடு படிகளை பின்பற்றவும்.",
            )

        return (
            "unknown",
            "Could not clearly confirm online availability from official content. Check the official portal section for this service before proceeding.",
            "आधिकारिक सामग्री से ऑनलाइन उपलब्धता स्पष्ट रूप से पुष्टि नहीं हुई। आगे बढ़ने से पहले इस सेवा के लिए आधिकारिक पोर्टल सेक्शन जांचें।",
            "அதிகாரப்பூர்வ உள்ளடக்கத்தில் இருந்து ஆன்லைன் கிடைப்பை தெளிவாக உறுதிப்படுத்த முடியவில்லை. தொடர்வதற்கு முன் இந்த சேவைக்கான அதிகாரப்பூர்வ தளப் பகுதியைச் சரிபார்க்கவும்.",
        )

    def _enrich_documents(
        self,
        service: GovernmentService,
        scraped_content: str | None,
    ) -> tuple[list[str], list[str], list[str]]:
        """Add small official-context notes to the document list without inventing new requirements."""
        documents = list(service.required_documents)
        documents_hi = list(service.required_documents_hi)
        documents_ta = list(service.required_documents_ta)

        note_en = "Check the official portal for the latest list because requirements can vary by update type."
        note_hi = "नवीनतम सूची के लिए आधिकारिक पोर्टल जांचें, क्योंकि आवश्यकताएं अपडेट के प्रकार के अनुसार बदल सकती हैं।"
        note_ta = "அண்மைப்பட்ட பட்டியலை அதிகாரப்பூர்வ தளத்தில் சரிபார்க்கவும், ஏனெனில் தேவைகள் புதுப்பிப்பு வகையைப் பொறுத்து மாறலாம்."

        if service.id == "aadhaar" and scraped_content:
            text = re.sub(r"\s+", " ", scraped_content.lower())
            if "document update" in text or "update demographics data" in text:
                documents.append(
                    "For updates, carry original supporting documents for verification if the portal or center asks for them."
                )
                documents_hi.append(
                    "अपडेट के लिए, यदि पोर्टल या केंद्र माँगे तो सत्यापन हेतु मूल सहायक दस्तावेज़ साथ रखें।"
                )
                documents_ta.append(
                    "புதுப்பிப்புகளுக்கு, தளம் அல்லது மையம் கேட்டால் சரிபார்ப்புக்காக மூல ஆதார ஆவணங்களை எடுத்துச் செல்லவும்."
                )

        documents.append(note_en)
        documents_hi.append(note_hi)
        documents_ta.append(note_ta)

        return documents, documents_hi, documents_ta

    def _enrich_eligibility(
        self,
        service: GovernmentService,
        scraped_content: str | None,
        availability_status: str,
        availability_en: str,
        availability_hi: str,
        availability_ta: str,
    ) -> tuple[str, str, str]:
        """Append source-aware eligibility notes."""
        extra_en = []
        extra_hi = []
        extra_ta = []

        if service.id == "aadhaar":
            extra_en.append("For name or demographic updates, the official myAadhaar workflow may be used when the portal permits it.")
            extra_hi.append("नाम या जनसांख्यिकीय अपडेट के लिए, जब पोर्टल अनुमति दे तब आधिकारिक myAadhaar प्रक्रिया का उपयोग किया जा सकता है।")
            extra_ta.append("பெயர் அல்லது மக்கள் விவரப் புதுப்பிப்புகளுக்கு, தளம் அனுமதிக்கும் போது அதிகாரப்பூர்வ myAadhaar செயல்முறையைப் பயன்படுத்தலாம்.")

        if availability_status != "unknown":
            extra_en.append(availability_en)
            extra_hi.append(availability_hi)
            extra_ta.append(availability_ta)

        eligibility_en = service.eligibility
        eligibility_hi = service.eligibility_hi
        eligibility_ta = service.eligibility_ta

        if extra_en:
            eligibility_en = f"{eligibility_en}. {' '.join(extra_en)}"
            eligibility_hi = f"{eligibility_hi}. {' '.join(extra_hi)}"
            eligibility_ta = f"{eligibility_ta}. {' '.join(extra_ta)}"

        return eligibility_en, eligibility_hi, eligibility_ta

    def _build_contact_summary(
        self,
        service: GovernmentService,
        availability_status: str,
        availability_en: str,
        availability_hi: str,
        availability_ta: str,
    ) -> tuple[str, str, str]:
        """Create a richer contact summary for the guide UI and TTS."""
        if service.id == "aadhaar":
            portal_note_en = "Use the official UIDAI portal or myAadhaar pages for updates, status checks, and document update options."
            portal_note_hi = "अपडेट, स्थिति जांच और दस्तावेज़ अपडेट विकल्पों के लिए आधिकारिक UIDAI पोर्टल या myAadhaar पेज का उपयोग करें।"
            portal_note_ta = "புதுப்பிப்புகள், நிலை சரிபார்ப்பு மற்றும் ஆவணப் புதுப்பிப்பு விருப்பங்களுக்கு அதிகாரப்பூர்வ UIDAI போர்டல் அல்லது myAadhaar பக்கங்களைப் பயன்படுத்தவும்."
        else:
            portal_note_en = f"Use the official {service.department} website for the latest service status and updates."
            portal_note_hi = f"नवीनतम स्थिति और अपडेट के लिए आधिकारिक {service.department} वेबसाइट का उपयोग करें।"
            portal_note_ta = f"அண்மை நிலை மற்றும் புதுப்பிப்புகளுக்கு அதிகாரப்பூர்வ {service.department} இணையதளத்தைப் பயன்படுத்தவும்."

        if availability_status != "unknown":
            portal_note_en = f"{portal_note_en} {availability_en}"
            portal_note_hi = f"{portal_note_hi} {availability_hi}"
            portal_note_ta = f"{portal_note_ta} {availability_ta}"

        return portal_note_en, portal_note_hi, portal_note_ta

    def _create_guide_steps(
        self,
        service: GovernmentService,
        scraped_content: str | None,
        availability_source_url: str,
        status: str,
        availability_en: str,
        availability_hi: str,
        availability_ta: str,
    ) -> list[GuideStep]:
        """Convert service steps to GuideStep format."""
        steps: list[GuideStep] = []
        max_steps = max(
            len(service.steps),
            len(service.steps_hi),
            len(service.steps_ta),
        )

        availability_prefix_en = (
            "Official check: "
            if status != "unknown"
            else "Official check (insufficient evidence): "
        )
        availability_prefix_hi = (
            "आधिकारिक जांच: "
            if status != "unknown"
            else "आधिकारिक जांच (पर्याप्त प्रमाण नहीं): "
        )
        availability_prefix_ta = (
            "அதிகாரப்பூர்வ சரிபார்ப்பு: "
            if status != "unknown"
            else "அதிகாரப்பூர்வ சரிபார்ப்பு (போதுமான சான்று இல்லை): "
        )

        steps.append(
            GuideStep(
                step_number=1,
                title="Official Availability Check",
                title_hi="आधिकारिक उपलब्धता जांच",
                title_ta="அதிகாரப்பூர்வ கிடைப்புத் சரிபார்ப்பு",
                description=(
                    f"{availability_prefix_en}{availability_en} Source: {availability_source_url}"
                ),
                description_hi=(
                    f"{availability_prefix_hi}{availability_hi} स्रोत: {availability_source_url}"
                ),
                description_ta=(
                    f"{availability_prefix_ta}{availability_ta} ஆதாரம்: {availability_source_url}"
                ),
            )
        )

        for i in range(max_steps):
            steps.append(GuideStep(
                step_number=i + 2,
                title=f"Step {i + 2}",
                title_hi=f"चरण {i + 2}",
                title_ta=f"படி {i + 2}",
                description=service.steps[i] if i < len(service.steps) else "",
                description_hi=service.steps_hi[i] if i < len(service.steps_hi) else "",
                description_ta=service.steps_ta[i] if i < len(service.steps_ta) else "",
            ))

        return steps

    async def search_and_generate(
        self,
        query: str,
        language: str = "en",
    ) -> list[GeneratedGuide]:
        """
        Search for services matching query and generate guides.

        Args:
            query: Search query (e.g., "aadhaar", "ration card")
            language: Language for results

        Returns:
            List of GeneratedGuide objects
        """
        services = search_services(query, language)
        guides = []

        for service in services[:3]:  # Limit to top 3 results
            guide = await self.generate_guide(service.id, language)
            if guide:
                guides.append(guide)

        return guides

    def list_all_services(self) -> list[dict]:
        """List all available services."""
        services = get_all_services()
        return [
            {
                "id": s.id,
                "name": s.name,
                "name_hi": s.name_hi,
                "name_ta": s.name_ta,
                "category": s.category,
                "official_url": s.official_url,
            }
            for s in services
        ]

    async def close(self):
        """Cleanup."""
        logger.info("Guide Generator Service closed")


# Singleton
_guide_service: GuideGeneratorService | None = None


def get_guide_service() -> GuideGeneratorService:
    """Get or create the guide generator service singleton."""
    global _guide_service
    if _guide_service is None:
        _guide_service = GuideGeneratorService()
    return _guide_service
