"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface FolderCardItem {
  id: string;
  title: string;
  tag: string;
  bg: string;
  desc: string;
  repoIndex: number;
}

export interface FolderGroup {
  title: string;
  subtitle: string;
  cards: FolderCardItem[];
}

export const CURATED_FOLDERS: FolderGroup[] = [
  {
    title: "Why RepoPulse Exists",
    subtitle: "3 core problems solved",
    cards: [
      {
        id: "prob-1",
        title: "Stack Mismatch",
        tag: "The Problem",
        bg: "linear-gradient(135deg,#881337,#09090b)",
        desc: "Second- and third-year students waste hours browsing GitHub only to hit complex C++ or legacy codebases. RepoPulse filters and ranks issues strictly against your known languages and frameworks.",
        repoIndex: 0,
      },
      {
        id: "prob-2",
        title: "Codebase Overwhelm",
        tag: "Plain-English Map",
        bg: "linear-gradient(135deg,#312e81,#09090b)",
        desc: "Dense READMEs and monorepos scare away first-time contributors. RepoPulse summarizes what the project actually does in plain English and gives you a 5-step local setup checklist.",
        repoIndex: 1,
      },
      {
        id: "prob-3",
        title: "First PR Anxiety",
        tag: "Contribution Mentor",
        bg: "linear-gradient(135deg,#064e3b,#09090b)",
        desc: "Not sure which file to edit or how to write a maintainer-ready Pull Request? The built-in Contribution Mentor pinpoints target directories and drafts your PR description.",
        repoIndex: 2,
      },
    ],
  },
  {
    title: "Hacktoberfest Starters",
    subtitle: "3 beginner-friendly repos",
    cards: [
      {
        id: "hf-1",
        title: "First Contributions",
        tag: "56.5k ★ · Markdown/Git",
        bg: "linear-gradient(135deg,#164e63,#09090b)",
        desc: "Practice the fork-branch-PR workflow in under 5 minutes with guided instructions and zero setup friction.",
        repoIndex: 0,
      },
      {
        id: "hf-2",
        title: "freeCodeCamp",
        tag: "459.4k ★ · TypeScript",
        bg: "linear-gradient(135deg,#14532d,#09090b)",
        desc: "Tackle well-scoped curriculum hints, accessibility fixes, and UI polish tickets with clear Mocha/Chai test suites.",
        repoIndex: 2,
      },
      {
        id: "hf-3",
        title: "shadcn/ui",
        tag: "78k+ ★ · React + Tailwind",
        bg: "linear-gradient(135deg,#3b0764,#09090b)",
        desc: "Contribute accessible component improvements, CLI error messages, and Tailwind documentation updates.",
        repoIndex: 1,
      },
    ],
  },
  {
    title: "GSoC & Web Frameworks",
    subtitle: "3 high-impact codebases",
    cards: [
      {
        id: "gsoc-1",
        title: "TanStack Query",
        tag: "43k+ ★ · TypeScript",
        bg: "linear-gradient(135deg,#1e3a8a,#09090b)",
        desc: "Learn async state management, caching internals, and TypeScript unit testing in a modern monorepo.",
        repoIndex: 3,
      },
      {
        id: "gsoc-2",
        title: "shadcn/ui Registry",
        tag: "Components & CLI",
        bg: "linear-gradient(135deg,#4c1d95,#09090b)",
        desc: "Explore Radix primitives, ARIA patterns, and CLI scaffolding built for real-world React apps.",
        repoIndex: 1,
      },
      {
        id: "gsoc-3",
        title: "freeCodeCamp Client",
        tag: "Full-Stack Curriculum",
        bg: "linear-gradient(135deg,#0f766e,#09090b)",
        desc: "Work on React components and automated challenge assertions used by millions of learners worldwide.",
        repoIndex: 2,
      },
    ],
  },
];

export function AnimatedFoldersShowcase({
  onSelectRepoIndex,
}: {
  onSelectRepoIndex: (repoIndex: number) => void;
}) {
  const [hoveredFolder, setHoveredFolder] = React.useState<number | null>(null);
  const [lightbox, setLightbox] = React.useState<{ folderIdx: number; cardIdx: number } | null>(null);

  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft" && lightbox.cardIdx > 0) {
        setLightbox({ ...lightbox, cardIdx: lightbox.cardIdx - 1 });
      }
      if (e.key === "ArrowRight" && lightbox.cardIdx < CURATED_FOLDERS[lightbox.folderIdx].cards.length - 1) {
        setLightbox({ ...lightbox, cardIdx: lightbox.cardIdx + 1 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const rotations = [-12, 0, 12];
  const translations = [-54, 0, 54];
  const activeFolder = lightbox ? CURATED_FOLDERS[lightbox.folderIdx] : null;
  const activeCard = activeFolder && lightbox ? activeFolder.cards[lightbox.cardIdx] : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CURATED_FOLDERS.map((folder, fIdx) => {
          const isHovered = hoveredFolder === fIdx;
          return (
            <div
              key={folder.title}
              onMouseEnter={() => setHoveredFolder(fIdx)}
              onMouseLeave={() => setHoveredFolder(null)}
              className="relative flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer bg-zinc-950/85 backdrop-blur-md border border-zinc-800 hover:border-indigo-500/40 hover:shadow-2xl transition-all duration-500"
              style={{ minHeight: 300, perspective: "1000px" }}
            >
              <div className="relative flex items-center justify-center mb-4" style={{ height: 150, width: 200 }}>
                <div
                  className="absolute w-32 h-24 rounded-lg shadow-md z-10"
                  style={{
                    background: "linear-gradient(145deg, #4338ca, #312e81)",
                    transformOrigin: "bottom center",
                    transform: isHovered ? "rotateX(-15deg)" : "rotateX(0deg)",
                    transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                <div
                  className="absolute w-12 h-4 rounded-t-md z-10"
                  style={{
                    background: "#4f46e5",
                    top: "calc(50% - 48px - 12px)",
                    left: "calc(50% - 64px + 14px)",
                    transformOrigin: "bottom center",
                    transform: isHovered ? "rotateX(-25deg) translateY(-2px)" : "rotateX(0deg)",
                    transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                <div className="absolute z-20" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                  {folder.cards.map((c, cIdx) => (
                    <div
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightbox({ folderIdx: fIdx, cardIdx: cIdx });
                      }}
                      className="absolute w-20 h-28 rounded-lg overflow-hidden shadow-xl border border-white/20 p-2 flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-indigo-400"
                      style={{
                        left: -40,
                        top: -56,
                        zIndex: 10 - cIdx,
                        background: c.bg,
                        transform: isHovered
                          ? `translateY(-88px) translateX(${translations[cIdx]}px) rotate(${rotations[cIdx]}deg) scale(1)`
                          : "translateY(0px) translateX(0px) rotate(0deg) scale(0.5)",
                        opacity: isHovered ? 1 : 0,
                        transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${cIdx * 80}ms`,
                      }}
                    >
                      <span className="text-[8px] font-mono uppercase text-white/75 leading-tight">{c.tag}</span>
                      <span className="text-[11px] font-bold text-white leading-tight">{c.title}</span>
                    </div>
                  ))}
                </div>
                <div
                  className="absolute w-32 h-24 rounded-lg shadow-lg z-30"
                  style={{
                    background: "linear-gradient(145deg, #6366f1, #4338ca)",
                    top: "calc(50% - 48px + 4px)",
                    transformOrigin: "bottom center",
                    transform: isHovered ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
                    transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                <div
                  className="absolute w-32 h-24 rounded-lg pointer-events-none z-30"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 55%)",
                    top: "calc(50% - 48px + 4px)",
                    transformOrigin: "bottom center",
                    transform: isHovered ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
                    transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              </div>
              <h3 className="text-base font-bold text-zinc-100 mt-3">{folder.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{folder.subtitle}</p>
              <span className="mt-2 text-[11px] text-indigo-400/80">Hover to open · Click card to inspect</span>
            </div>
          );
        })}
      </div>

      {lightbox && activeFolder && activeCard ? (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden"
          >
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="h-52 w-full p-6 flex flex-col justify-between" style={{ background: activeCard.bg }}>
              <span className="text-xs font-mono uppercase tracking-widest text-white/70">{activeFolder.title}</span>
              <div className="text-2xl font-bold text-white">{activeCard.title}</div>
            </div>
            <div className="p-6 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">{activeCard.tag}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={lightbox.cardIdx <= 0}
                    onClick={() => setLightbox({ ...lightbox, cardIdx: lightbox.cardIdx - 1 })}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={lightbox.cardIdx >= activeFolder.cards.length - 1}
                    onClick={() => setLightbox({ ...lightbox, cardIdx: lightbox.cardIdx + 1 })}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-100">{activeCard.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{activeCard.desc}</p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const idx = activeCard.repoIndex;
                    setLightbox(null);
                    onSelectRepoIndex(idx);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  Load in Analyzer ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
