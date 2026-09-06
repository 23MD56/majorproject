import React, { useState } from "react";
import { Play, Video, Clock } from "lucide-react";
import { GlassCard, ModalSheet, PrimaryButton } from "../ui";

interface VideoFacadeItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  summary: string;
}

const VIDEO_EXPLAINERS: VideoFacadeItem[] = [
  {
    id: "vid_1",
    title: "How Regime Alpha Protects Your Capital",
    duration: "2:45",
    thumbnail: "from-violet-600 to-indigo-700",
    summary: "Discover how QuantNiti's 4-state Hidden Markov Model switches between bull and bear stances to reduce drawdown without timing tops and bottoms.",
  },
  {
    id: "vid_2",
    title: "Monte Carlo Risk Simulators Demystified",
    duration: "3:10",
    thumbnail: "from-purple-600 to-violet-800",
    summary: "See how 1,000 geometric Brownian motion paths project probable portfolio outcomes so you know your worst-case drawdown before investing.",
  },
  {
    id: "vid_3",
    title: "Virtual Paper Portfolios vs Real Money",
    duration: "1:55",
    thumbnail: "from-indigo-600 to-slate-800",
    summary: "Master systematic investing principles safely through zero-risk algorithmic paper simulation before deploying real hard-earned rupees.",
  },
];

export interface VideoFacadesProps {
  className?: string;
}

export const VideoFacades: React.FC<VideoFacadesProps> = ({ className = "" }) => {
  const [activeVideo, setActiveVideo] = useState<VideoFacadeItem | null>(null);

  return (
    <GlassCard className={`p-5 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Video className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-[var(--text-main)]">
              Video Explainers
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Bite-Sized Visual Concepts
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VIDEO_EXPLAINERS.map((video) => (
          <div
            key={video.id}
            data-testid="video-facade-card"
            onClick={() => setActiveVideo(video)}
            className="group relative overflow-hidden rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-violet-500/40 cursor-pointer transition-all duration-150 flex flex-col"
          >
            {/* Thumbnail Poster */}
            <div
              className={`h-24 w-full bg-gradient-to-br ${video.thumbnail} relative flex items-center justify-center p-3`}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>

              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {video.duration}
              </span>
            </div>

            {/* Title & Description */}
            <div className="p-3 flex flex-col gap-1">
              <h4 className="text-xs font-bold text-[var(--text-main)] group-hover:text-accent transition-colors line-clamp-1">
                {video.title}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                {video.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal Sheet */}
      <ModalSheet
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        title={activeVideo?.title || "Video Explainer"}
      >
        {activeVideo && (
          <div className="flex flex-col gap-4 py-2">
            <div
              className={`h-40 w-full rounded-2xl bg-gradient-to-br ${activeVideo.thumbnail} flex items-center justify-center relative p-4 text-center`}
            >
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <span className="text-xs font-semibold">Interactive Video Demo</span>
              </div>
            </div>

            <p className="text-sm text-[var(--text-main)] leading-relaxed">
              {activeVideo.summary}
            </p>

            <PrimaryButton fullWidth onClick={() => setActiveVideo(null)}>
              Close Video Preview
            </PrimaryButton>
          </div>
        )}
      </ModalSheet>
    </GlassCard>
  );
};
