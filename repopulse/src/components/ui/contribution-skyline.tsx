"use client";

import * as React from "react";

interface Cell {
  date: string;
  count: number;
  week: number;
  day: number;
  level: number;
}

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

function seedFromStr(str: string): number {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h || 7;
}

export function ContributionSkyline({ repoName }: { repoName: string }) {
  const [view, setView] = React.useState<"2d" | "3d">("3d");
  const [tip, setTip] = React.useState<{ text: string; x: number; y: number } | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const model = React.useMemo(() => {
    const r = rng(seedFromStr(repoName));
    const DAY_MS = 86400000;
    const endMs = Math.floor(Date.now() / DAY_MS) * DAY_MS;
    const days = 371;
    const bursts = Array.from({ length: 4 }, () => ({
      at: r(),
      width: 0.035 + r() * 0.07,
      gain: 0.6 + r() * 1.1,
    }));
    const raw: { date: string; count: number }[] = [];
    let mood = 0.5;
    for (let i = 0; i < days; i++) {
      const ms = endMs - (days - 1 - i) * DAY_MS;
      const x = i / Math.max(1, days - 1);
      const dow = new Date(ms).getUTCDay();
      const weekend = dow === 0 || dow === 6;
      let heat = 0.2;
      for (const b of bursts) heat += b.gain * Math.exp(-((x - b.at) ** 2) / (2 * b.width ** 2));
      mood = mood * 0.85 + r() * 0.15;
      heat *= 0.55 + mood * 0.9;
      const pActive = Math.min(0.94, (weekend ? 0.22 : 0.5) + heat * 0.4);
      let count = 0;
      if (r() < pActive) count = 1 + Math.floor(-Math.log(1 - r()) * (1.2 + heat * 7) * (weekend ? 0.5 : 1));
      if (r() < 0.01) count += 12 + Math.floor(r() * 18);
      raw.push({ date: new Date(ms).toISOString().slice(0, 10), count });
    }

    const cells: Cell[] = raw.map((d, idx) => ({
      date: d.date,
      count: d.count,
      week: Math.floor(idx / 7),
      day: idx % 7,
      level: 0,
    }));
    const nz = cells.map((c) => c.count).filter((c) => c > 0).sort((a, b) => a - b);
    const busy = nz.length ? nz[Math.floor(0.95 * (nz.length - 1))] : 0;
    const max = nz.length ? nz[nz.length - 1] : 0;
    let total = 0;
    let best = 0;
    let bestDate = "";
    let run = 0;
    let longest = 0;
    cells.forEach((c) => {
      c.level = c.count <= 0 ? 0 : busy <= 0 ? 4 : 1 + Math.min(3, Math.floor((c.count / busy) * 4));
      total += c.count;
      if (c.count > best) {
        best = c.count;
        bestDate = c.date;
      }
      if (c.count > 0) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    });
    return {
      cells,
      weeks: cells.length ? cells[cells.length - 1].week + 1 : 0,
      max,
      total,
      best,
      bestDate,
      longest,
    };
  }, [repoName]);

  const animRef = React.useRef({
    t: 1,
    target: 1,
    yaw: 0,
    elev: 0,
    yawGoal: 0,
    elevGoal: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    hovered: -1,
    polys: [] as number[][][],
    raf: 0,
    lastTime: 0,
  });

  const draw = React.useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || !model.cells.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = stage.clientWidth;
    const H = stage.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    const st = animRef.current;
    const clamp01 = (v: number) => (v > 0 ? (v < 1 ? v : 1) : 0);
    const easeInOut = (x: number) => {
      const t = clamp01(x);
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const e = easeInOut(st.t);
    const yaw = Math.min((82 * Math.PI) / 180, Math.max(0, lerp(0, Math.PI / 4 + st.yaw, e)));
    const elev = lerp(
      Math.PI / 2,
      Math.min((62 * Math.PI) / 180, Math.max((18 * Math.PI) / 180, (34 * Math.PI) / 180 + st.elev)),
      e,
    );
    const cs = Math.cos(yaw);
    const sn = Math.sin(yaw);
    const se = Math.sin(elev);
    const ce = Math.cos(elev);
    const proj = (x: number, y: number, z: number): [number, number] => [
      x * cs - y * sn,
      (x * sn + y * cs) * se - z * ce,
    ];

    const { cells, weeks, max } = model;
    const w = lerp(0.78, 0.9, e);
    const off = (1 - w) / 2;

    const zs = cells.map((c) => {
      const barH = c.count > 0 && max > 0 ? 0.4 + Math.pow(c.count / max, 0.85) * 7.2 : 0.2;
      const d = (weeks > 1 ? c.week / (weeks - 1) : 0) * 0.36 + (c.day / 6) * 0.06;
      return easeOut((st.t - d) / (1 - 0.42)) * barH;
    });

    let minx = Infinity,
      maxx = -Infinity,
      miny = Infinity,
      maxy = -Infinity;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i],
        x0 = c.week + off,
        y0 = c.day + off,
        z = zs[i];
      [
        [x0, y0, z],
        [x0 + w, y0, z],
        [x0 + w, y0 + w, z],
        [x0 + w, y0 + w, 0],
        [x0, y0 + w, 0],
        [x0 + w, y0, 0],
      ].forEach(([px, py, pz]) => {
        const [sx, sy] = proj(px, py, pz);
        if (sx < minx) minx = sx;
        if (sx > maxx) maxx = sx;
        if (sy < miny) miny = sy;
        if (sy > maxy) maxy = sy;
      });
    }

    const pad = 22;
    const bw = Math.max(1e-6, maxx - minx);
    const bh = Math.max(1e-6, maxy - miny);
    const s = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    const ox = pad + (W - pad * 2 - bw * s) / 2 - minx * s;
    const oy = pad + (H - pad * 2 - bh * s) / 2 - miny * s;
    const px = (x: number, y: number) => ox + (x * cs - y * sn) * s;
    const py = (x: number, y: number, z: number) => oy + ((x * sn + y * cs) * se - z * ce) * s;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const colors = [
      [39, 39, 42],
      [45, 31, 79],
      [85, 60, 154],
      [139, 92, 246],
      [196, 181, 253],
    ];
    const order = Array.from({ length: cells.length }, (_, i) => i).sort(
      (a, b) =>
        (cells[a].week + 0.5) * sn +
        (cells[a].day + 0.5) * cs -
        ((cells[b].week + 0.5) * sn + (cells[b].day + 0.5) * cs),
    );

    st.polys = new Array(cells.length);
    order.forEach((i) => {
      const c = cells[i];
      const x0 = c.week + off,
        y0 = c.day + off,
        x1 = x0 + w,
        y1 = y0 + w;
      const isHov = i === st.hovered;
      const z = zs[i] + (isHov ? 0.7 * e : 0);
      const top = [
        [px(x0, y0), py(x0, y0, z)],
        [px(x1, y0), py(x1, y0, z)],
        [px(x1, y1), py(x1, y1, z)],
        [px(x0, y1), py(x0, y1, z)],
      ];
      st.polys[i] = top;

      const [r, g, b] = colors[c.level];
      const tall = z * ce * s;
      if (tall > 0.35 && w * cs * s > 0.35) {
        ctx.beginPath();
        ctx.moveTo(px(x0, y1), py(x0, y1, 0));
        ctx.lineTo(px(x1, y1), py(x1, y1, 0));
        ctx.lineTo(top[2][0], top[2][1]);
        ctx.lineTo(top[3][0], top[3][1]);
        ctx.closePath();
        ctx.fillStyle = `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(b * 0.82)})`;
        ctx.fill();
      }
      if (tall > 0.35 && w * sn * s > 0.35) {
        ctx.beginPath();
        ctx.moveTo(px(x1, y0), py(x1, y0, 0));
        ctx.lineTo(px(x1, y1), py(x1, y1, 0));
        ctx.lineTo(top[2][0], top[2][1]);
        ctx.lineTo(top[1][0], top[1][1]);
        ctx.closePath();
        ctx.fillStyle = `rgb(${Math.round(r * 0.64)},${Math.round(g * 0.64)},${Math.round(b * 0.64)})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      ctx.lineTo(top[1][0], top[1][1]);
      ctx.lineTo(top[2][0], top[2][1]);
      ctx.lineTo(top[3][0], top[3][1]);
      ctx.closePath();
      ctx.fillStyle = isHov
        ? `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)})`
        : `rgb(${r},${g},${b})`;
      ctx.fill();
      if (isHov) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }, [model]);

  const kick = React.useCallback(() => {
    const st = animRef.current;
    cancelAnimationFrame(st.raf);
    st.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - st.lastTime) / 1000);
      st.lastTime = now;
      let moving = false;
      if (Math.abs(st.t - st.target) > 0.002) {
        const step = dt / 1.1;
        st.t += st.target > st.t ? Math.min(step, st.target - st.t) : -Math.min(step, st.t - st.target);
        moving = true;
      } else {
        st.t = st.target;
      }
      const k = 1 - Math.exp(-12 * dt);
      if (Math.abs(st.yaw - st.yawGoal) > 0.001 || Math.abs(st.elev - st.elevGoal) > 0.001) {
        st.yaw += (st.yawGoal - st.yaw) * k;
        st.elev += (st.elevGoal - st.elev) * k;
        moving = true;
      }
      draw();
      if (moving) st.raf = requestAnimationFrame(loop);
    };
    st.raf = requestAnimationFrame(loop);
  }, [draw]);

  React.useEffect(() => {
    animRef.current.target = view === "3d" ? 1 : 0;
    kick();
  }, [view, model, kick]);

  React.useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  return (
    <div className="bg-zinc-950/85 backdrop-blur-md rounded-2xl border border-zinc-800 p-5 sm:p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Activity Pulse · 2D / 3D Isometric
          </span>
          <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
            {model.total.toLocaleString()} commits in the last year · {repoName}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Busiest day: {model.best} commits ({model.bestDate}) · Longest streak: {model.longest} days
          </p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("2d")}
            className={
              view === "2d"
                ? "px-3 py-1 rounded-md bg-indigo-600 text-white shadow-sm transition"
                : "px-3 py-1 rounded-md text-zinc-400 hover:text-zinc-100 transition"
            }
          >
            2D Grid
          </button>
          <button
            type="button"
            onClick={() => setView("3d")}
            className={
              view === "3d"
                ? "px-3 py-1 rounded-md bg-indigo-600 text-white shadow-sm transition"
                : "px-3 py-1 rounded-md text-zinc-400 hover:text-zinc-100 transition"
            }
          >
            3D Skyline
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        onPointerDown={(e) => {
          if (view !== "3d") return;
          animRef.current.dragging = true;
          animRef.current.lastX = e.clientX;
          animRef.current.lastY = e.clientY;
        }}
        onPointerMove={(e) => {
          const st = animRef.current;
          if (st.dragging) {
            const dx = e.clientX - st.lastX;
            const dy = e.clientY - st.lastY;
            st.lastX = e.clientX;
            st.lastY = e.clientY;
            st.yawGoal = Math.max(-0.55, Math.min(0.55, st.yawGoal - dx * 0.006));
            st.elevGoal = Math.max(-0.25, Math.min(0.45, st.elevGoal + dy * 0.006));
            kick();
            return;
          }
          const stage = stageRef.current;
          if (!stage) return;
          const rect = stage.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          let hit = -1;
          for (let i = st.polys.length - 1; i >= 0; i--) {
            const poly = st.polys[i];
            if (!poly) continue;
            let inside = false;
            for (let a = 0, b = 3; a < 4; b = a++) {
              const [xi, yi] = poly[a];
              const [xj, yj] = poly[b];
              if ((yi > my) !== (yj > my) && mx < ((xj - xi) * (my - yi)) / (yj - yi + 1e-9) + xi) {
                inside = !inside;
              }
            }
            if (inside) {
              hit = i;
              break;
            }
          }
          if (hit !== st.hovered) {
            st.hovered = hit;
            draw();
          }
          if (hit !== -1) {
            const c = model.cells[hit];
            setTip({
              text: `${c.count} ${c.count === 1 ? "commit" : "commits"} on ${c.date}`,
              x: Math.min(rect.width - 170, Math.max(8, mx + 12)),
              y: Math.max(8, my - 32),
            });
          } else {
            setTip(null);
          }
        }}
        onPointerUp={() => {
          animRef.current.dragging = false;
        }}
        onPointerLeave={() => {
          animRef.current.dragging = false;
          animRef.current.hovered = -1;
          setTip(null);
          draw();
        }}
        onDoubleClick={() => {
          animRef.current.yawGoal = 0;
          animRef.current.elevGoal = 0;
          kick();
        }}
        className="relative w-full overflow-hidden rounded-xl bg-black/40 border border-zinc-800/80 cursor-grab active:cursor-grabbing"
        style={{ height: 320 }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
        {tip ? (
          <div
            className="pointer-events-none absolute z-20 px-2.5 py-1.5 rounded-lg bg-zinc-900/95 border border-zinc-700 text-xs text-zinc-100 shadow-lg whitespace-nowrap"
            style={{ left: tip.x, top: tip.y }}
          >
            {tip.text}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span>Drag in 3D to orbit · Double-click to reset angle · Hover any bar for daily activity</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="w-3 h-3 rounded-sm bg-zinc-800 inline-block" />
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#2d1f4f" }} />
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#553c9a" }} />
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#8b5cf6" }} />
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#c4b5fd" }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
