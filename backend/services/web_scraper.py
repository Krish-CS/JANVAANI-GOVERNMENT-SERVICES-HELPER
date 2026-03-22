"""
JanVaani — Web Scraper Service
Scrapes official .gov.in websites to fetch latest procedural information.
Uses httpx + BeautifulSoup for lightweight scraping.
Only targets official Indian government domains.
"""

from __future__ import annotations

import logging
import asyncio
from dataclasses import dataclass
from typing import Literal
from urllib.parse import urljoin
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("janvaani.scraper")

# ─── Official Government Domains ──────────────────────────────────────
OFFICIAL_DOMAINS = {
    "uidai.gov.in": "UIDAI - Aadhaar Services",
    "eci.gov.in": "Election Commission of India",
    "voterhelpline.eci.gov.in": "Voter Helpline",
    "passportindia.gov.in": "Passport Seva",
    "incometax.gov.in": "Income Tax Department",
    "onlineservices.nsdl.com": "NSDL e-Gov (PAN Services)",
    "utiitsl.com": "UTIITSL (PAN Services)",
    "pmkisan.gov.in": "PM Kisan Samman Nidhi",
    "mca.gov.in": "Ministry of Corporate Affairs",
    "parivahan.gov.in": "Ministry of Road Transport (mParivahan)",
    "fcs.delhigovt.nic.in": "Food & Civil Supplies Delhi",
    "fssai.gov.in": "Food Safety and Standards Authority",
    "mohfw.gov.in": "Ministry of Health & Family Welfare",
    "ayushmanbharat.gov.in": "Ayushman Bharat (PMJAY)",
    "epfindia.gov.in": "Employees' Provident Fund",
    "labour.gov.in": "Ministry of Labour & Employment",
    "eshram.gov.in": "e-Shram Portal",
    "pensionersportal.gov.in": "Pensioners Portal",
    "socialjustice.gov.in": "Ministry of Social Justice",
    "rural.nic.in": "Ministry of Rural Development",
    "nrega.nic.in": "MGNREGA",
    "bhulekh": "Land Records (state-specific)",
    "darpan": "Digital Aadhaar Payment",
    "digiLocker.gov.in": "DigiLocker",
    "india.gov.in": "National Portal of India",
    "mygov.in": "MyGov India",
    "umang.gov.in": "UMANG App",
}


@dataclass
class ScrapedContent:
    """Represents scraped content from a government website."""
    url: str
    title: str
    content: str
    links: list[dict]  # [{text, url}]
    success: bool
    error: str | None = None
    domain: str = ""


class WebScraperService:
    """Web scraper for official Indian government websites."""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=20.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            follow_redirects=True,
            verify=True,
        )
        logger.info("✅ Web Scraper Service initialized")

    @property
    def is_available(self) -> bool:
        return True

    def _is_official_domain(self, url: str) -> bool:
        """Check if URL belongs to an official government domain."""
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        for domain in OFFICIAL_DOMAINS.keys():
            normalized_domain = domain.lower()
            if host == normalized_domain or host.endswith(f".{normalized_domain}"):
                return True
        return False

    async def scrape_url(self, url: str, quiet_404: bool = False) -> ScrapedContent:
        """
        Scrape content from a government website.

        Args:
            url: URL to scrape

        Returns:
            ScrapedContent with title, content, and links
        """
        # Validate domain
        if not self._is_official_domain(url):
            return ScrapedContent(
                url=url,
                title="",
                content="",
                links=[],
                success=False,
                error="Only official .gov.in domains are allowed",
            )

        try:
            logger.info("🌐 Scraping: %s", url)
            response = None
            last_error: Exception | None = None
            for attempt in range(2):
                try:
                    response = await self.client.get(url)
                    response.raise_for_status()
                    break
                except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.HTTPError) as e:
                    last_error = e
                    if attempt == 0:
                        await asyncio.sleep(1)
                        continue
                    raise

            if response is None:
                raise last_error or httpx.HTTPError("Failed to fetch URL")

            soup = BeautifulSoup(response.text, "html.parser")

            # Extract title
            title = ""
            if soup.title:
                title = soup.title.string.strip() if soup.title.string else ""

            # Remove script and style elements
            for script in soup(["script", "style", "noscript", "iframe"]):
                script.decompose()

            # Extract main content (try common selectors first)
            main_content = ""
            for selector in ["main", "article", ".content", "#content", ".main-content"]:
                element = soup.select_one(selector)
                if element:
                    main_content = element.get_text(separator="\n", strip=True)
                    break

            # Fallback: get body text
            if not main_content and soup.body:
                main_content = soup.body.get_text(separator="\n", strip=True)

            # Limit content length
            if len(main_content) > 10000:
                main_content = main_content[:10000] + "..."

            # Extract links
            links = []
            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True)
                href = a["href"]
                if text and len(text) < 200:  # Skip very long link texts
                    full_url = urljoin(url, href)
                    # Only include official domain links
                    if self._is_official_domain(full_url):
                        links.append({"text": text, "url": full_url})

            # Limit links
            links = links[:20]

            # Extract domain
            domain = ""
            for d in OFFICIAL_DOMAINS.keys():
                if d in url.lower():
                    domain = d
                    break

            logger.info("✅ Scraped successfully: %s (title=%s, links=%d)",
                       url, title[:50] if title else "N/A", len(links))

            return ScrapedContent(
                url=url,
                title=title,
                content=main_content,
                links=links,
                success=True,
                domain=domain,
            )

        except httpx.TimeoutException as e:
            logger.error("⚠️ Timeout scraping %s: %s", url, e)
            return ScrapedContent(
                url=url,
                title="",
                content="",
                links=[],
                success=False,
                error=f"Timeout: {str(e)}",
            )
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            if status_code == 404 and quiet_404:
                logger.info("ℹ️ Candidate page not found (404): %s", url)
            elif 400 <= status_code < 500:
                logger.warning("⚠️ Client error scraping %s: %s", url, e)
            else:
                logger.error("⚠️ HTTP status error scraping %s: %s", url, e)
            return ScrapedContent(
                url=url,
                title="",
                content="",
                links=[],
                success=False,
                error=f"HTTP Error: {str(e)}",
            )
        except httpx.HTTPError as e:
            logger.error("⚠️ HTTP error scraping %s: %s", url, e)
            return ScrapedContent(
                url=url,
                title="",
                content="",
                links=[],
                success=False,
                error=f"HTTP Error: {str(e)}",
            )
        except Exception as e:
            logger.error("⚠️ Error scraping %s: %s", url, e, exc_info=True)
            return ScrapedContent(
                url=url,
                title="",
                content="",
                links=[],
                success=False,
                error=str(e),
            )

    async def search_service_page(
        self,
        service_name: str,
        department: str,
    ) -> ScrapedContent | None:
        """
        Search for a service page on the official department website.

        Args:
            service_name: Name of the service (e.g., "Aadhaar", "PAN")
            department: Department name (e.g., "UIDAI", "Income Tax")

        Returns:
            ScrapedContent or None if not found
        """
        # Map departments to base URLs
        department_urls = {
            "uidai": "https://uidai.gov.in",
            "election commission": "https://voterhelpline.eci.gov.in",
            "passport": "https://www.passportindia.gov.in",
            "income tax": "https://www.incometax.gov.in",
            "nsdl": "https://www.onlineservices.nsdl.com",
            "pmkisan": "https://pmkisan.gov.in",
            "food supplies": "https://fcs.delhigovt.nic.in",
            "mgnrega": "https://nrega.nic.in",
            "epfo": "https://epfindia.gov.in",
            "ayushman bharat": "https://ayushmanbharat.gov.in",
        }

        base_url = None
        for dept_key, url in department_urls.items():
            if dept_key.lower() in department.lower():
                base_url = url
                break

        if not base_url:
            return None

        # Try common URL patterns
        service_slug = service_name.lower().replace(" ", "-")
        urls_to_try = [
            f"{base_url}/{service_slug}",
            f"{base_url}/{service_slug}.html",
            f"{base_url}/{service_slug}.aspx",
            f"{base_url}/services/{service_slug}",
        ]

        if "uidai" in department.lower() or "aadhaar" in service_name.lower():
            urls_to_try = [
                "https://uidai.gov.in/en/my-aadhaar.html",
                "https://uidai.gov.in/en/my-aadhaar/update-your-aadhaar.html",
                "https://uidai.gov.in/en/my-aadhaar/update-your-aadhaar/update-demographic-data.html",
                "https://uidai.gov.in/en/my-aadhaar/update-your-aadhaar/update-your-aadhaar-data.html",
                *urls_to_try,
            ]

        for url in urls_to_try:
            result = await self.scrape_url(url, quiet_404=True)
            if result.success:
                return result

        # Fallback: scrape homepage
        return await self.scrape_url(base_url)

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton
_scraper_service: WebScraperService | None = None


def get_scraper_service() -> WebScraperService:
    """Get or create the web scraper service singleton."""
    global _scraper_service
    if _scraper_service is None:
        _scraper_service = WebScraperService()
    return _scraper_service
