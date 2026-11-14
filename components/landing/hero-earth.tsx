"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Decorative orthographic globe. No map, model run, WebGL or live-data request. */
export function HeroEarth() {
  const { L } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const control = useRef<((pause: boolean) => void) | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // A bounded raster budget stays sharp in the larger desktop globe without
    // multiplying the animation cost by the screen's device-pixel ratio.
    const size = 512;
    canvas.width = canvas.height = size;
    const texture = new window.Image();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false, inView = true, manualPause = false, frame = 0;
    let elapsed = 0, previous = 0, lastPaint = 0;
    let paint: (() => void) | undefined;

    const tick = (time: number) => {
      if (previous) elapsed += Math.min(time - previous, 100);
      previous = time;
      if (time - lastPaint >= 50) { paint?.(); lastPaint = time; }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!disposed && paint && inView && !document.hidden && !manualPause && !reduced.matches)
        frame = requestAnimationFrame(tick);
      else paint?.();
    };
    control.current = (pause) => { manualPause = pause; sync(); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);

    texture.onload = () => {
      if (disposed) return;
      const source = document.createElement("canvas");
      source.width = texture.width; source.height = texture.height;
      const sourceContext = source.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return;
      sourceContext.drawImage(texture, 0, 0);
      const pixels = sourceContext.getImageData(0, 0, source.width, source.height).data;
      const image = ctx.createImageData(size, size);
      const offsets: number[] = [], longitude: number[] = [], rows: number[] = [], light: number[] = [];
      const pitch = 12 * Math.PI / 180;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const px = (x + 0.5) / (size / 2) - 1;
        const py = 1 - (y + 0.5) / (size / 2);
        const radius = px * px + py * py;
        if (radius >= 1) continue;
        const z = Math.sqrt(1 - radius);
        const wy = py * Math.cos(pitch) + z * Math.sin(pitch);
        const wz = z * Math.cos(pitch) - py * Math.sin(pitch);
        const offset = (y * size + x) * 4;
        offsets.push(offset);
        longitude.push(Math.atan2(px, wz) / (2 * Math.PI) + 0.5);
        rows.push(Math.min(source.height - 1, Math.floor((0.5 - Math.asin(wy) / Math.PI) * source.height)) * source.width);
        light.push(0.16 + 0.84 * Math.max(0, -0.35 * px + 0.25 * py + 0.9 * z));
        image.data[offset + 3] = Math.min(255, (1 - Math.sqrt(radius)) * size / 2 * 255);
      }
      const index = Uint32Array.from(offsets), u = Float32Array.from(longitude);
      const row = Uint32Array.from(rows), shade = Float32Array.from(light);
      paint = () => {
        const rotation = 105 / 360 + elapsed / 100000;
        for (let i = 0; i < index.length; i++) {
          const from = (row[i] + Math.floor(((u[i] + rotation) % 1) * source.width)) * 4;
          const to = index[i];
          image.data[to] = pixels[from] * shade[i];
          image.data[to + 1] = pixels[from + 1] * shade[i];
          image.data[to + 2] = pixels[from + 2] * shade[i] + 4;
        }
        ctx.putImageData(image, 0, 0);
      };
      paint(); setReady(true); sync();
    };
    texture.src = "/images/earth-blue-marble.jpg";
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      texture.onload = null;
      control.current = null;
    };
  }, []);

  return <figure className="relative mx-auto w-full min-w-0 max-w-[550px] py-4 lg:max-w-[650px] lg:py-6">
    <div className="relative aspect-square" aria-hidden="true">
      <div className="absolute inset-[4%] rounded-full bg-sky-400/10 blur-3xl" />
      <svg viewBox="0 0 560 560" className="absolute inset-0 h-full w-full fill-none">
        <circle cx="280" cy="280" r="269" stroke="white" strokeOpacity="0.14" strokeDasharray="2 10" />
        <ellipse cx="280" cy="280" rx="277" ry="105" transform="rotate(-25 280 280)" stroke="#a8dc5c" strokeOpacity="0.35" />
        <ellipse cx="280" cy="280" rx="269" ry="166" transform="rotate(32 280 280)" stroke="#8bd5ff" strokeOpacity="0.16" strokeDasharray="4 12" />
        <path d="M510 214h18m-9-9v18M57 370h14m-7-7v14" stroke="white" strokeOpacity="0.6" />
      </svg>
      <div className="absolute inset-[12%] overflow-hidden rounded-full border border-sky-200/30 bg-[#10344a] shadow-[0_0_45px_5px_rgba(75,165,222,.22),0_25px_65px_rgba(0,0,0,.6)] lg:inset-[8%]">
        <div className="absolute inset-0 bg-[url('/images/earth-blue-marble.jpg')] bg-cover bg-center" />
        <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${ready ? "opacity-100" : "opacity-0"}`} />
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_-16px_-6px_24px_rgba(0,8,20,.3),inset_2px_2px_12px_rgba(144,218,255,.25)]" />
      </div>
      <span className="absolute left-[4%] top-[17%] h-2 w-2 rounded-full bg-lime-bright shadow-[0_0_12px_#a8dc5c]" />
    </div>
    <figcaption className="relative mt-1 flex items-center justify-between gap-3 px-5 lg:mt-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-lime-bright">{L("A global view. A local decision.", "Hiểu Trái Đất, chủ động mùa vụ.")}</p>
        <p className="mt-1 text-[10px] text-white/50">{L("Illustration · ", "Địa cầu minh họa · ")}<a href="/images/CREDITS.md" target="_blank" rel="noreferrer" className="underline decoration-white/25 underline-offset-2">NASA Blue Marble · CC BY-SA 3.0</a></p>
      </div>
      <button type="button" aria-label={paused ? L("Resume globe rotation", "Tiếp tục xoay địa cầu") : L("Pause globe rotation", "Dừng xoay địa cầu")} aria-pressed={paused}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-space-950/50 text-white/70 hover:bg-white/10 motion-reduce:hidden"
        onClick={() => { const next = !paused; setPaused(next); control.current?.(next); }}>
        {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
      </button>
    </figcaption>
  </figure>;
}
