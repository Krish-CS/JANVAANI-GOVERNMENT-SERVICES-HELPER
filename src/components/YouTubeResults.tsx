import { useState } from "react";
import { Youtube, ExternalLink, Play, Clock, Eye, Calendar, X } from "lucide-react";
import type { YouTubeVideo } from "../utils/api";

interface YouTubeResultsProps {
  videos: YouTubeVideo[];
  searchUrl?: string;
  language: "en" | "hi" | "ta";
  title?: string;
  compact?: boolean;
}

export default function YouTubeResults({ videos, searchUrl, language, title, compact = false }: YouTubeResultsProps) {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const getLocalizedText = () => {
    const texts = {
      title: {
        en: "Video Tutorials",
        hi: "वीडियो ट्यूटोरियल",
        ta: "வீடியோ பயிற்சிகள்",
      },
      watchOnYouTube: {
        en: "Watch on YouTube",
        hi: "YouTube पर देखें",
        ta: "YouTube இல் பார்க்க",
      },
      noVideos: {
        en: "No videos found. Search on YouTube instead.",
        hi: "कोई वीडियो नहीं मिला। YouTube पर खोजें।",
        ta: "வீடியோக்கள் எதுவும் கிடைக்கவில்லை. YouTube இல் தேடவும்.",
      },
      views: {
        en: "views",
        hi: "दृश्य",
        ta: "பார்வைகள்",
      },
    };

    return {
      title: texts.title[language],
      watchOnYouTube: texts.watchOnYouTube[language],
      noVideos: texts.noVideos[language],
      views: texts.views[language],
    };
  };

  const text = getLocalizedText();

  // Helper to extract YouTube video ID
  const getYouTubeId = (url: string): string => {
    try {
      if (!url) return "";
      if (url.includes("youtube.com/watch?v=")) {
        return url.split("v=")[1].split("&")[0];
      }
      if (url.includes("youtu.be/")) {
        return url.split("youtu.be/")[1].split("?")[0];
      }
      if (url.includes("youtube.com/shorts/")) {
        return url.split("/shorts/")[1].split("?")[0].split("/")[0];
      }
      if (url.includes("youtube.com/embed/")) {
        return url.split("/embed/")[1].split("?")[0].split("/")[0];
      }
    } catch {
      // Ignore
    }
    return "";
  };

  const playableVideos = videos.filter((video) => Boolean(getYouTubeId(video.url)));

  if (videos.length === 0 || playableVideos.length === 0) {
    return (
      <div className="text-center py-8">
        <Youtube className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">{text.noVideos}</p>
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {text.watchOnYouTube}
          </a>
        )}
      </div>
    );
  }

  if (compact) {
    // Compact horizontal scroll view
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">{title || text.title}</h3>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {playableVideos.slice(0, 6).map((video, index) => {
            const videoId = getYouTubeId(video.url);
            
            return (
              <button
                key={index}
                onClick={() => setSelectedVideo(video)}
                className="shrink-0 w-40 group text-left"
              >
                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700 group-hover:border-red-500/50 transition-colors">
                  <img
                    src={video.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white ml-0.5" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
                      {video.duration}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-white line-clamp-2 group-hover:text-cyan-400 transition-colors">
                  {video.title}
                </p>
                {video.channel && (
                  <p className="text-[10px] text-slate-500 truncate">{video.channel}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Video Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div className="relative w-full max-w-4xl">
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-10 right-0 text-white hover:text-red-400 transition-colors"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </button>
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.url)}?autoplay=1`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4 bg-slate-900 rounded-lg p-4">
                <h3 className="font-bold text-white">{selectedVideo.title}</h3>
                {selectedVideo.channel && (
                  <p className="mt-1 text-sm text-slate-400">{selectedVideo.channel}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full grid view
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-bold text-white">{title || text.title}</h3>
        </div>
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {text.watchOnYouTube} →
          </a>
        )}
      </div>

      {/* Video Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {playableVideos.map((video, index) => {
          const videoId = getYouTubeId(video.url);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedVideo(video)}
              className="group block text-left rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50 hover:border-red-500/50 hover:bg-slate-800 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={video.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                  }}
                />

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>

                {/* Duration badge */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
                    {video.duration}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors">
                  {video.title}
                </h4>

                {video.channel && (
                  <p className="mt-1 text-xs text-slate-400 truncate">{video.channel}</p>
                )}

                {/* Meta */}
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  {video.views && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{video.views}</span>
                    </div>
                  )}
                  {video.published && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{video.published}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Video Modal (when clicked) */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-10 right-0 text-white hover:text-red-400 transition-colors"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.url)}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4 bg-slate-900 rounded-lg p-4">
              <h3 className="font-bold text-white">{selectedVideo.title}</h3>
              {selectedVideo.channel && (
                <p className="mt-1 text-sm text-slate-400">{selectedVideo.channel}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
