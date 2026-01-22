import { useEffect, useMemo, useRef, useState } from "react";

type Rgb = { r: number; g: number; b: number };

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const rgbToCss = (c: Rgb, a = 1) => `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${a})`;

const luminance = (c: Rgb) => {
  // Relative luminance approximation; good enough for light/dark switching
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
};

const median = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
};

const getPaletteFromImage = async (src: string): Promise<{ dominant: Rgb; secondary: Rgb; uiMode: "light" | "dark" } | null> => {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
    });

    const size = 80;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);

    const { data } = ctx.getImageData(0, 0, size, size);

    // Sample outer 15% border, excluding a center mask (subject) ~ middle 50%.
    const border = Math.floor(size * 0.15);
    const cx0 = Math.floor(size * 0.25);
    const cx1 = Math.floor(size * 0.75);
    const cy0 = Math.floor(size * 0.25);
    const cy1 = Math.floor(size * 0.75);

    const r: number[] = [];
    const g: number[] = [];
    const b: number[] = [];

    const rt: number[] = [];
    const gt: number[] = [];
    const bt: number[] = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const inBorder = x < border || x >= size - border || y < border || y >= size - border;
        if (!inBorder) continue;
        const inCenterMask = x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1;
        if (inCenterMask) continue;

        const i = (y * size + x) * 4;
        const alpha = data[i + 3] ?? 255;
        if (alpha < 32) continue;

        const rr = data[i] ?? 0;
        const gg = data[i + 1] ?? 0;
        const bb = data[i + 2] ?? 0;

        // skip near-white margins (common in portrait photos)
        if (rr > 245 && gg > 245 && bb > 245) continue;

        r.push(rr);
        g.push(gg);
        b.push(bb);

        // Secondary tint: weight toward top edge to better match "background" feel
        if (y < border) {
          rt.push(rr);
          gt.push(gg);
          bt.push(bb);
        }
      }
    }

    if (r.length < 40) return null;

    const dominant: Rgb = { r: median(r), g: median(g), b: median(b) };
    const secondary: Rgb = rt.length > 20
      ? { r: median(rt), g: median(gt), b: median(bt) }
      : dominant;

    const uiMode: "light" | "dark" = luminance(dominant) > 0.62 ? "light" : "dark";
    return { dominant, secondary, uiMode };
  } catch {
    return null;
  }
};

export function AdaptiveBackdrop({
  imageSrc,
  children,
}: {
  imageSrc: string;
  children: (params: { uiMode: "light" | "dark" }) => React.ReactNode;
}) {
  const [current, setCurrent] = useState<{ dominant: Rgb; secondary: Rgb; uiMode: "light" | "dark" } | null>(null);
  const [prev, setPrev] = useState<typeof current>(null);
  const [fadePrev, setFadePrev] = useState(false);
  const lastSrcRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!imageSrc || lastSrcRef.current === imageSrc) return;
    lastSrcRef.current = imageSrc;

    (async () => {
      const palette = await getPaletteFromImage(imageSrc);
      if (cancelled || !palette) return;
      setPrev(current);
      setFadePrev(true);
      // delay helps avoid flashes on slide change
      window.setTimeout(() => {
        if (cancelled) return;
        setCurrent(palette);
        window.setTimeout(() => {
          if (!cancelled) setFadePrev(false);
        }, 450);
      }, 250);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  const fallback = useMemo(() => ({
    dominant: { r: 10, g: 10, b: 10 },
    secondary: { r: 30, g: 30, b: 30 },
    uiMode: "dark" as const,
  }), []);

  const active = current ?? fallback;

  const backdropStyle = (p: NonNullable<typeof current>) => {
    const dom = rgbToCss(p.dominant, 1);
    const sec = rgbToCss(p.secondary, 1);
    const dark = rgbToCss({
      r: Math.floor(p.dominant.r * 0.35),
      g: Math.floor(p.dominant.g * 0.35),
      b: Math.floor(p.dominant.b * 0.35),
    }, 1);
    return {
      backgroundImage: `radial-gradient(1200px circle at 30% 20%, ${dom} 0%, ${sec} 45%, ${dark} 100%)`,
    } as React.CSSProperties;
  };

  return (
    <div className="absolute inset-0">
      {/* Blurred image backdrop (mirrors the slide without affecting the main image) */}
      {prev && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${fadePrev ? "opacity-100" : "opacity-0"}`}
          style={backdropStyle(prev)}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 transition-opacity duration-500" style={backdropStyle(active)} aria-hidden />

      {/* Optional blurred copy of image */}
      <img
        src={imageSrc}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-[70px] saturate-90 opacity-60"
        draggable={false}
      />

      {/* Edge blending / vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 140px rgba(0,0,0,0.12)",
          backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.10) 100%)",
        }}
      />

      {children({ uiMode: active.uiMode })}
    </div>
  );
}
