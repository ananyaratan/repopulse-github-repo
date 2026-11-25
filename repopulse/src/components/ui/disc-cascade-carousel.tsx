"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { RepoRecord } from "@/lib/github";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inkFor(bg: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return "#ffffff";
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.45 ? "#111111" : "#ffffff";
}

function DiscArt({ repo, idx }: { repo: RepoRecord; idx: number }) {
  const [bg, fg, ac] = repo.palette || ["#1b1d1f", "#4f46e5", "#c7d2fe"];
  const ink = inkFor(bg);
  const r = rng((idx + 1) * 9973 + 17);
  const pat = repo.pattern;
  const uid = `dcc_${idx}_`;
  const title = (repo.name || repo.fullName).toUpperCase().slice(0, 18);
  const fine = `${repo.language} · ${repo.stars} STARS · REPOPULSE`.toUpperCase();

  const shapes: React.ReactNode[] = [<rect key="bg" width="200" height="200" fill={bg} />];
  if (pat === "sunburst") {
    for (let i = 0; i < 28; i += 2) {
      const a0 = (i / 28) * Math.PI * 2;
      const a1 = ((i + 1) / 28) * Math.PI * 2;
      const p0 = `${(100 + 142 * Math.cos(a0)).toFixed(1)} ${(100 + 142 * Math.sin(a0)).toFixed(1)}`;
      const p1 = `${(100 + 142 * Math.cos(a1)).toFixed(1)} ${(100 + 142 * Math.sin(a1)).toFixed(1)}`;
      shapes.push(<path key={`w${i}`} d={`M100 100L${p0}A142 142 0 0 1 ${p1}Z`} fill={fg} />);
    }
    shapes.push(<circle key="c" cx="100" cy="100" r="44" fill={ac} />);
  } else if (pat === "eclipse") {
    for (let j = 0; j < 45; j++) {
      shapes.push(
        <circle
          key={`s${j}`}
          cx={(r() * 200).toFixed(1)}
          cy={(r() * 200).toFixed(1)}
          r={(0.5 + r() * 1.1).toFixed(1)}
          fill={fg}
          opacity="0.65"
        />,
      );
    }
    shapes.push(
      <circle key="m" cx="100" cy="100" r="64" fill={fg} />,
      <circle key="b" cx="118" cy="88" r="60" fill={bg} />,
    );
  } else if (pat === "mosaic") {
    const cols = [bg, fg, ac];
    for (let y = 0; y < 200; y += 25) {
      for (let x = 0; x < 200; x += 25) {
        const c = cols[Math.floor(r() * 3)];
        shapes.push(<rect key={`r${x}-${y}`} x={x} y={y} width="25" height="25" fill={c} />);
        if (r() > 0.65) {
          shapes.push(<circle key={`o${x}-${y}`} cx={x + 12.5} cy={y + 12.5} r="8" fill={cols[Math.floor(r() * 3)]} />);
        }
      }
    }
  } else {
    shapes.push(
      <circle key="sun" cx="100" cy="96" r="24" fill={ac} opacity="0.9" />,
      <rect key="gnd" y="124" width="200" height="76" fill={fg} />,
    );
  }

  return (
    <>
      <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 w-full h-full">
        <defs>
          <path id={`${uid}top`} d="M28 100a72 72 0 1 1 144 0" />
          <path id={`${uid}bot`} d="M14 100a86 86 0 0 0 172 0" />
        </defs>
        {shapes}
        <text
          fill={ink}
          fontSize="13"
          fontWeight="700"
          textAnchor="middle"
          stroke={bg}
          strokeWidth="2"
          paintOrder="stroke"
        >
          <textPath href={`#${uid}top`} startOffset="50%">
            {title}
          </textPath>
        </text>
        <text
          fill={ink}
          fontSize="5.4"
          letterSpacing="0.8"
          textAnchor="middle"
          opacity="0.9"
          stroke={bg}
          strokeWidth="1"
          paintOrder="stroke"
        >
          <textPath href={`#${uid}bot`} startOffset="50%">
            {fine}
          </textPath>
        </text>
        <text
          x="100"
          y="152"
          fill={ink}
          fontSize="8.5"
          fontWeight="800"
          textAnchor="middle"
          stroke={bg}
          strokeWidth="1.2"
          paintOrder="stroke"
        >
          RP
        </text>
      </svg>
      <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
        <circle cx="100" cy="100" r="35.5" fill="none" stroke="#cbd5e1" strokeWidth="4" />
        <circle cx="100" cy="100" r="25.5" fill="rgba(232,235,239,0.85)" stroke="rgba(232,235,239,0.85)" strokeWidth="16" />
        <circle cx="100" cy="100" r="17.6" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" />
        <circle cx="100" cy="100" r="99.3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
      </svg>
    </>
  );
}

interface DiscCascadeCarouselProps {
  repos: RepoRecord[];
  activeIndex: number;
  onIndexChange: (idx: number) => void;
  onInspectActive: () => void;
}

export function DiscCascadeCarousel({
  repos,
  activeIndex,
  onIndexChange,
  onInspectActive,
}: DiscCascadeCarouselProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const slideRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const animRef = React.useRef({
    pos: activeIndex,
    vel: 0,
    tiltPos: activeIndex,
    tiltVel: 0,
    target: activeIndex,
    raf: 0,
    lastT: 0,
    dragging: false,
    dragStartX: 0,
    dragStartPos: 0,
    dragMoved: false,
  });

  const applyTransforms = React.useCallback(() => {
    const st = animRef.current;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const dx = i - st.pos;
      const d = i - st.tiltPos;
      const near = Math.min(d, 2.2);
      const x = dx * 102;
      const y = -dx * 24;
      const z = near * 115;
      const yaw = 22 + d * -10;
      const roll = d * 110;
      const opacity = d < -2.5 ? Math.max(0, 1 - (-d - 2.5) / 1.2) : 1;
      const hidden = dx < -4 || dx > 2.8;
      el.style.display = hidden ? "none" : "block";
      el.style.zIndex = String(100 + Math.round(d * 10));
      el.style.opacity = String(opacity);
      el.style.transform = `translate3d(${x}%, ${y}%, ${z}px) rotateX(-6deg) rotateY(${yaw}deg)`;
      const rollEl = el.querySelector<HTMLElement>(".dcc-roll");
      if (rollEl) rollEl.style.setProperty("--dcc-roll", `${roll.toFixed(1)}deg`);
    });
  }, []);

  const startAnim = React.useCallback(() => {
    const st = animRef.current;
    cancelAnimationFrame(st.raf);
    st.lastT = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - st.lastT) / 1000);
      st.lastT = now;
      const omega = (2 * Math.PI) / 0.85;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let k = 0; k < steps; k++) {
        st.vel += (-omega * omega * (st.pos - st.target) - 2 * 0.89 * omega * st.vel) * h;
        st.pos += st.vel * h;
        st.tiltVel += (-omega * omega * (st.tiltPos - st.target) - 2 * 0.78 * omega * st.tiltVel) * h;
        st.tiltPos += st.tiltVel * h;
      }
      applyTransforms();
      if (
        Math.abs(st.pos - st.target) > 0.001 ||
        Math.abs(st.vel) > 0.001 ||
        Math.abs(st.tiltPos - st.target) > 0.001 ||
        Math.abs(st.tiltVel) > 0.001
      ) {
        st.raf = requestAnimationFrame(step);
      } else {
        st.pos = st.target;
        st.tiltPos = st.target;
        applyTransforms();
      }
    };
    st.raf = requestAnimationFrame(step);
  }, [applyTransforms]);

  React.useEffect(() => {
    animRef.current.target = activeIndex;
    startAnim();
  }, [activeIndex, repos.length, startAnim]);

  const activeRepo = repos[activeIndex] || repos[0];
  if (!activeRepo) return null;

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" && activeIndex > 0) onIndexChange(activeIndex - 1);
        if (e.key === "ArrowRight" && activeIndex < repos.length - 1) onIndexChange(activeIndex + 1);
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest(".dcc-slide")) {
          return;
        }
        const st = animRef.current;
        st.dragging = true;
        st.dragMoved = false;
        st.dragStartX = e.clientX;
        st.dragStartPos = st.pos;
      }}
      onPointerMove={(e) => {
        const st = animRef.current;
        if (!st.dragging) return;
        const dx = e.clientX - st.dragStartX;
        if (Math.abs(dx) > 6) st.dragMoved = true;
        st.target = Math.max(-0.3, Math.min(repos.length - 0.7, st.dragStartPos - dx / 220));
        st.pos = st.target;
        st.tiltPos = st.target;
        applyTransforms();
      }}
      onPointerUp={() => {
        const st = animRef.current;
        if (!st.dragging) return;
        st.dragging = false;
        if (st.dragMoved) {
          const nextIdx = Math.max(0, Math.min(repos.length - 1, Math.round(st.target)));
          onIndexChange(nextIdx);
        }
      }}
      className="relative overflow-hidden w-full h-[460px] sm:h-[490px] select-none outline-none border-b border-zinc-800"
      style={{
        containerType: "inline-size",
        background:
          "radial-gradient(circle at 65% 40%, rgba(23, 21, 59, 0.52) 0%, rgba(9, 9, 11, 0.58) 55%, rgba(2, 1, 10, 0.72) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/10 z-[1]" />

      {/* Top Nav */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 text-xs whitespace-nowrap">
        <span className="font-extrabold tracking-widest uppercase text-indigo-400">
          REPOPULSE CATALOGUE
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-zinc-900/85 text-zinc-100 font-medium"
          >
            <span>Jump to Repo</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {menuOpen ? (
            <ul className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[260px] p-1.5 rounded-xl bg-zinc-950/95 border border-white/15 shadow-2xl z-30">
              {repos.map((r, i) => (
                <li key={r.fullName}>
                  <button
                    type="button"
                    onClick={() => {
                      onIndexChange(i);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-baseline gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs ${
                      i === activeIndex ? "bg-indigo-600/25 font-semibold text-white" : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-50">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{r.fullName}</span>
                    <span className="ml-auto text-[10px] opacity-50">{r.language}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Left Credits Block */}
      <div className="absolute top-8 left-7 z-[4] w-[210px] sm:w-[270px]">
        <h2 className="font-serif text-2xl sm:text-4xl text-white leading-none mb-3">
          {activeRepo.name || activeRepo.fullName}
        </h2>
        <dl className="text-xs">
          <div className="flex justify-between gap-2 py-1.5 border-t border-white/15">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Stack</dt>
            <dd className="text-zinc-200 font-medium text-right">{activeRepo.stack.slice(0, 3).join(", ")}</dd>
          </div>
          <div className="flex justify-between gap-2 py-1.5 border-t border-white/15">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Stars</dt>
            <dd className="text-zinc-200 font-medium">{activeRepo.stars}</dd>
          </div>
          <div className="flex justify-between gap-2 py-1.5 border-t border-white/15">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Good First Issues</dt>
            <dd className="text-zinc-200 font-medium">{activeRepo.issues.length} open</dd>
          </div>
        </dl>
      </div>

      {/* 3D Disc Stage */}
      <div
        className="absolute left-[58%] sm:left-[54%] top-[45%] -translate-x-1/2 -translate-y-1/2 aspect-square"
        style={{
          width: "clamp(150px, min(38vmin, 25vw), 255px)",
          perspective: "800px",
        }}
      >
        {repos.map((r, i) => (
          <button
            key={r.fullName + i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            type="button"
            aria-label={`Select ${r.fullName}`}
            onClick={() => {
              if (animRef.current.dragMoved) return;
              if (i === activeIndex) onInspectActive();
              else onIndexChange(i);
            }}
            className="dcc-slide absolute inset-0 rounded-full cursor-pointer outline-none"
            style={{ transformStyle: "preserve-3d" }}
          >
            <span
              className="dcc-roll absolute inset-0 rounded-full overflow-hidden shadow-2xl"
              style={{
                transform: "rotate(var(--dcc-roll, 0deg))",
                WebkitMask: "radial-gradient(circle closest-side, transparent 16.6%, #000 17.1%)",
                mask: "radial-gradient(circle closest-side, transparent 16.6%, #000 17.1%)",
              }}
            >
              <DiscArt repo={r} idx={i} />
            </span>
          </button>
        ))}
      </div>

      {/* Mentor Quote */}
      <div className="hidden md:block absolute bottom-7 left-1/2 -translate-x-1/2 z-[4] bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-center max-w-xs pointer-events-none">
        <div className="text-[9px] font-bold tracking-widest uppercase text-indigo-400 mb-0.5">
          Mentor Take
        </div>
        <p className="font-serif text-base text-zinc-100 leading-tight">
          “{activeRepo.mentorNote}”
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="absolute left-7 bottom-7 z-[5] flex items-center gap-3">
        <button
          type="button"
          onClick={onInspectActive}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
        >
          Inspect Active Repo ↓
        </button>
        <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-zinc-400">
          Drag or use ← →
        </span>
      </div>

      <div className="absolute right-7 bottom-7 z-[5] flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous repository"
          disabled={activeIndex <= 0}
          onClick={() => onIndexChange(activeIndex - 1)}
          className="w-8 h-8 rounded-full border border-white/20 bg-zinc-900/85 flex items-center justify-center text-zinc-100 disabled:opacity-30 hover:border-indigo-400"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono font-semibold text-zinc-300 min-w-[48px] text-center">
          {String(activeIndex + 1).padStart(2, "0")} / {String(repos.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          aria-label="Next repository"
          disabled={activeIndex >= repos.length - 1}
          onClick={() => onIndexChange(activeIndex + 1)}
          className="w-8 h-8 rounded-full border border-white/20 bg-zinc-900/85 flex items-center justify-center text-zinc-100 disabled:opacity-30 hover:border-indigo-400"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
