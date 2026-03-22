"""
JanVaani — YouTube Search Service
Fetches tutorial videos from YouTube for government services.
Uses youtube-search-python library (no API key required).
Returns videos in the user's preferred language.
"""

from __future__ import annotations

import logging
import asyncio
from dataclasses import dataclass
from typing import Literal
from datetime import datetime

logger = logging.getLogger("janvaani.youtube")

# Language-specific YouTube search suffixes
LANGUAGE_SUFFIXES = {
    "en": "in english",
    "hi": "हिंदी में",
    "ta": "தமிழில்",
    "te": "తెలుగులో",
    "bn": "বাংলায়",
    "mr": "मराठीत",
    "gu": "ગુજરાતીમાં",
    "kn": "ಕನ್ನಡದಲ್ಲಿ",
    "ml": "മലയാളത്തിൽ",
}


@dataclass
class YouTubeVideo:
    """Represents a YouTube video result."""
    title: str
    url: str
    channel: str
    duration: str
    views: str
    thumbnail: str
    published: str


class YouTubeSearchService:
    """YouTube search service for tutorial videos."""

    def __init__(self):
        self._cache: dict[str, list[YouTubeVideo]] = {}
        logger.info("✅ YouTube Search Service initialized")

    @property
    def is_available(self) -> bool:
        return True

    async def search(
        self,
        query: str,
        language: str = "en",
        max_results: int = 18,
    ) -> list[YouTubeVideo]:
        """
        Search YouTube for tutorial videos.

        Args:
            query: Search query (e.g., "how to apply aadhaar card")
            language: Language code for results
            max_results: Maximum number of results to return

        Returns:
            List of YouTubeVideo objects
        """
        # Check cache
        cache_key = f"{query}:{language}:{max_results}"
        if cache_key in self._cache:
            logger.info("📺 YouTube cache hit: %s", query[:50])
            return self._cache[cache_key]

        try:
            # Add language suffix to query
            lang_suffix = LANGUAGE_SUFFIXES.get(language, "")
            year = datetime.now().year
            full_query = f"{query} {lang_suffix}".strip()
            query_variants = [
                full_query,
                f"{query} official latest {year} {lang_suffix}".strip(),
                f"{query} how to apply latest {lang_suffix}".strip(),
            ]

            logger.info("📺 Searching YouTube (recent + language): %s", full_query)

            # Run multiple blocking searches and merge results.
            merged_results: list[dict] = []
            seen_suffixes: set[str] = set()
            for q in query_variants:
                partial = await asyncio.to_thread(
                    self._search_youtube,
                    q,
                    max(12, max_results),
                )
                for r in partial:
                    suffix = r.get("url_suffix", "")
                    if suffix and suffix not in seen_suffixes:
                        seen_suffixes.add(suffix)
                        merged_results.append(r)

            results = self._sort_recent_first(merged_results)

            videos: list[YouTubeVideo] = []
            for r in results:
                raw_url = ""
                if r.get("url_suffix"):
                    raw_url = f"https://youtube.com{r.get('url_suffix')}"
                elif r.get("link"):
                    raw_url = r.get("link", "")
                elif r.get("id"):
                    raw_url = f"https://youtube.com/watch?v={r.get('id')}"

                thumbnails = r.get("thumbnails") or []
                thumbnail_url = ""
                if thumbnails:
                    first_thumb = thumbnails[0]
                    if isinstance(first_thumb, dict):
                        thumbnail_url = first_thumb.get("url", "")
                    elif isinstance(first_thumb, str):
                        thumbnail_url = first_thumb

                channel_value = r.get("channel", "")
                if isinstance(channel_value, dict):
                    channel_name = channel_value.get("name", "")
                else:
                    channel_name = str(channel_value or "")

                videos.append(YouTubeVideo(
                    title=r.get("title", ""),
                    url=raw_url,
                    channel=channel_name,
                    duration=r.get("duration", ""),
                    views=r.get("views", ""),
                    thumbnail=thumbnail_url,
                    published=r.get("publish_time", ""),
                ))

            # Keep only playable links.
            videos = [
                v for v in videos
                if v.url and (
                    "youtube.com/watch?v=" in v.url
                    or "youtu.be/" in v.url
                    or "youtube.com/shorts/" in v.url
                    or "youtube.com/embed/" in v.url
                )
            ]

            # Fallback: retry with plain English queries if localized query yields no playable videos.
            if not videos and language != "en":
                english_variants = [
                    f"{query} how to apply official {year}",
                    f"{query} tutorial official",
                ]
                for q in english_variants:
                    partial = await asyncio.to_thread(self._search_youtube, q, max(12, max_results))
                    for r in partial:
                        raw_url = ""
                        if r.get("url_suffix"):
                            raw_url = f"https://youtube.com{r.get('url_suffix')}"
                        elif r.get("link"):
                            raw_url = r.get("link", "")
                        elif r.get("id"):
                            raw_url = f"https://youtube.com/watch?v={r.get('id')}"

                        thumbnails = r.get("thumbnails") or []
                        thumbnail_url = ""
                        if thumbnails:
                            first_thumb = thumbnails[0]
                            if isinstance(first_thumb, dict):
                                thumbnail_url = first_thumb.get("url", "")
                            elif isinstance(first_thumb, str):
                                thumbnail_url = first_thumb

                        channel_value = r.get("channel", "")
                        if isinstance(channel_value, dict):
                            channel_name = channel_value.get("name", "")
                        else:
                            channel_name = str(channel_value or "")

                        if raw_url and (
                            "youtube.com/watch?v=" in raw_url
                            or "youtu.be/" in raw_url
                            or "youtube.com/shorts/" in raw_url
                            or "youtube.com/embed/" in raw_url
                        ):
                            videos.append(
                                YouTubeVideo(
                                    title=r.get("title", ""),
                                    url=raw_url,
                                    channel=channel_name,
                                    duration=r.get("duration", ""),
                                    views=r.get("views", ""),
                                    thumbnail=thumbnail_url,
                                    published=r.get("publish_time", ""),
                                )
                            )

                # Deduplicate by URL after fallback.
                deduped: dict[str, YouTubeVideo] = {}
                for v in videos:
                    if v.url not in deduped:
                        deduped[v.url] = v
                videos = list(deduped.values())

            videos = self._filter_by_language_preference(videos, language)
            videos = videos[:max_results]

            # Cache results
            self._cache[cache_key] = videos

            logger.info("✅ Found %d YouTube videos for: %s", len(videos), query[:50])
            return videos

        except ImportError:
            logger.warning("⚠️ youtube-search-python not installed, returning empty results")
            return self._fallback_search(query, language, max_results)
        except Exception as e:
            logger.error("⚠️ YouTube search error: %s", e, exc_info=True)
            return self._fallback_search(query, language, max_results)

    def _search_youtube(self, query: str, max_results: int) -> list[dict]:
        """Blocking YouTube search using available library.

        Supports both:
        - youtube_search (module: youtube_search, class: YoutubeSearch)
        - youtube-search-python (module: youtubesearchpython, class: VideosSearch)
        """
        try:
            from youtube_search import YoutubeSearch

            search = YoutubeSearch(query, max_results=max_results)
            if hasattr(search, "to_dict"):
                results = search.to_dict()
            else:
                results = getattr(search, "videos", [])
            return results
        except Exception as e:
            logger.debug("youtube_search module unavailable: %s", e)

        try:
            from youtubesearchpython import VideosSearch

            search = VideosSearch(query, limit=max_results)
            response = search.result() or {}
            items = response.get("result", [])

            normalized: list[dict] = []
            for item in items:
                video_id = item.get("id", "")
                link = item.get("link", "")
                channel_info = item.get("channel") or {}
                view_info = item.get("viewCount") or {}
                normalized.append(
                    {
                        "title": item.get("title", ""),
                        "id": video_id,
                        "url_suffix": f"/watch?v={video_id}" if video_id else "",
                        "link": link,
                        "channel": channel_info.get("name", ""),
                        "duration": item.get("duration", ""),
                        "views": view_info.get("short", ""),
                        "thumbnails": item.get("thumbnails", []),
                        "publish_time": item.get("publishedTime", ""),
                    }
                )

            return normalized
        except Exception as e:
            logger.error("YouTube search error: %s", e)
            return []

    def _sort_recent_first(self, results: list[dict]) -> list[dict]:
        """Best-effort recency sort using publish_time text from results."""
        def recency_score(item: dict) -> int:
            published = (item.get("publish_time") or "").lower()
            if "hour" in published or "minute" in published or "just now" in published:
                return 5
            if "day" in published:
                return 4
            if "week" in published:
                return 3
            if "month" in published:
                return 2
            if "year" in published:
                return 1
            return 0

        return sorted(results, key=recency_score, reverse=True)

    def _filter_by_language_preference(
        self,
        videos: list[YouTubeVideo],
        language: str,
    ) -> list[YouTubeVideo]:
        """Prefer title script matching selected language where possible."""
        if not videos:
            return videos

        def has_devanagari(text: str) -> bool:
            return any("\u0900" <= ch <= "\u097F" for ch in text)

        def has_tamil(text: str) -> bool:
            return any("\u0B80" <= ch <= "\u0BFF" for ch in text)

        if language == "en":
            preferred = [v for v in videos if not has_devanagari(v.title) and not has_tamil(v.title)]
            return preferred if preferred else videos

        if language == "hi":
            preferred = [v for v in videos if has_devanagari(v.title)]
            return preferred if len(preferred) >= 3 else videos

        if language == "ta":
            preferred = [v for v in videos if has_tamil(v.title)]
            return preferred if len(preferred) >= 3 else videos

        return videos

    def _fallback_search(
        self,
        query: str,
        language: str,
        max_results: int,
    ) -> list[YouTubeVideo]:
        """
        Fallback: return search URL instead of actual results.
        Used when youtube-search-python is not available.
        """
        lang_suffix = LANGUAGE_SUFFIXES.get(language, "")
        full_query = f"{query} {lang_suffix}".strip()
        search_url = f"https://www.youtube.com/results?search_query={full_query.replace(' ', '+')}"

        return [
            YouTubeVideo(
                title=f"Search '{query}' on YouTube ({language})",
                url=search_url,
                channel="YouTube",
                duration="",
                views="",
                thumbnail="",
                published="",
            )
        ]

    def get_search_url(self, query: str, language: str = "en") -> str:
        """Get a YouTube search URL for the query."""
        lang_suffix = LANGUAGE_SUFFIXES.get(language, "")
        full_query = f"{query} {lang_suffix}".strip()
        return f"https://www.youtube.com/results?search_query={full_query.replace(' ', '+')}"

    async def close(self):
        """Cleanup (clear cache)."""
        self._cache.clear()
        logger.info("YouTube Search Service closed")


# Singleton
_youtube_service: YouTubeSearchService | None = None


def get_youtube_service() -> YouTubeSearchService:
    """Get or create the YouTube search service singleton."""
    global _youtube_service
    if _youtube_service is None:
        _youtube_service = YouTubeSearchService()
    return _youtube_service
