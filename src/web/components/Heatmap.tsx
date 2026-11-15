import { useEffect, useRef, type MouseEvent } from "react";
import type { Episode, ShowDetail } from "@/domain/types";
import {
  autoMinVotes,
  maxEpisodeNumber,
  ratingBand,
  type RatingBand,
} from "@/domain/rating";

interface HeatmapProps {
  show: ShowDetail;
  colorblind: boolean;
  onSelect: (episode: Episode) => void;
  onToggleColorblind: () => void;
}

const BRAND = "episoderating.com";
const CELL_W = 52;
const CELL_H = 36;
const GAP = 8;
const LEFT = 48;
const RIGHT = 24;
const HEADER = 88;
const COL_HEAD = 40;
const FOOTER = 40;
const TOP = HEADER + COL_HEAD;
const CELL_ALPHA = 0.88;
const EMPTY_ALPHA = 0.28;

const PALETTE: Record<RatingBand, string> = {
  excellent: "#008e34",
  good: "#6bbe48",
  "above-average": "#d6e101",
  "below-average": "#f9dc00",
  poor: "#f17215",
  terrible: "#d91722",
  none: "#2a323e",
};

const PALETTE_CB: Record<RatingBand, string> = {
  excellent: "#0072b2",
  good: "#56b4e9",
  "above-average": "#cc79a7",
  "below-average": "#f0e442",
  poor: "#e69f00",
  terrible: "#d55e00",
  none: "#2a323e",
};

interface Layout {
  width: number;
  height: number;
  cellW: number;
  cellH: number;
  gap: number;
  left: number;
  top: number;
  cols: number;
  rows: number;
}

function lighten(hex: string, amount = 0.35): string {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

function withAlpha(hex: string, alpha: number): string {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const tryLoad = (anonymous: boolean) => {
      const img = new Image();
      if (anonymous) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        // CORS-anonymous often fails (e.g. some poster hosts). Fall back so the
        // backdrop still paints; download may be unavailable if the canvas is tainted.
        if (anonymous) tryLoad(false);
        else resolve(null);
      };
      img.src = src;
    };
    tryLoad(true);
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

export function Heatmap({
  show,
  colorblind,
  onSelect,
  onToggleColorblind,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<(Episode | null)[][]>([]);
  const layoutRef = useRef<Layout | null>(null);

  const seasons = show.seasons;
  const minVotes = autoMinVotes(seasons);
  const rows = maxEpisodeNumber(seasons);
  const cols = Math.max(seasons.length, 1);
  const backdropSrc = show.backdropUrl || show.posterUrl || null;
  const dpr =
    typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // Intrinsic size — full graph at readable pill size, then CSS-scaled to fit.
  const gridW = cols * CELL_W + Math.max(cols - 1, 0) * GAP;
  const gridH = rows * CELL_H + Math.max(rows - 1, 0) * GAP;
  const width = Math.max(LEFT + gridW + RIGHT, 420);
  const height = TOP + gridH + FOOTER;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cancelled = false;

    const layout: Layout = {
      width,
      height,
      cellW: CELL_W,
      cellH: CELL_H,
      gap: GAP,
      left: LEFT,
      top: TOP,
      cols,
      rows,
    };
    layoutRef.current = layout;

    async function paint() {
      const image = backdropSrc ? await loadImage(backdropSrc) : null;
      if (cancelled || !ctx || !canvas) return;

      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      // Display size is controlled by CSS (scale to container).
      canvas.style.width = "";
      canvas.style.height = "";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colors = colorblind ? PALETTE_CB : PALETTE;
      hitRef.current = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => null),
      );

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      roundRect(ctx, 0, 0, width, height, 14);
      ctx.clip();

      if (image && image.naturalWidth > 0) {
        drawCoverImage(ctx, image, width, height);
        // Light veil only — keep the backdrop visible behind pills.
        ctx.fillStyle = "rgba(8, 10, 14, 0.28)";
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = "#0c1017";
        ctx.fillRect(0, 0, width, height);
      }

      const topGrad = ctx.createLinearGradient(0, 0, 0, HEADER + 8);
      topGrad.addColorStop(0, "rgba(8,10,14,0.72)");
      topGrad.addColorStop(1, "rgba(8,10,14,0)");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, HEADER + 8);

      const bottomGrad = ctx.createLinearGradient(
        0,
        height - FOOTER - 12,
        0,
        height,
      );
      bottomGrad.addColorStop(0, "rgba(8,10,14,0)");
      bottomGrad.addColorStop(1, "rgba(8,10,14,0.75)");
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, height - FOOTER - 12, width, FOOTER + 12);

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#f3efe6";
      ctx.font = "700 20px 'Source Sans 3', sans-serif";
      const title = truncate(ctx, show.title, width - LEFT - RIGHT - 170);
      ctx.fillText(title, LEFT, 32);

      ctx.fillStyle = "#d7dde6";
      ctx.font = "13px 'Source Sans 3', sans-serif";
      ctx.fillText("Episode ratings by season", LEFT, 54);

      ctx.textAlign = "right";
      ctx.fillStyle = "#e8b86d";
      ctx.font = "700 14px 'Source Sans 3', sans-serif";
      ctx.fillText(BRAND, width - RIGHT, 32);
      ctx.fillStyle = "#c5ccd6";
      ctx.font = "12px 'Source Sans 3', sans-serif";
      ctx.fillText(show.imdbId, width - RIGHT, 54);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";

      seasons.forEach((season, col) => {
        const x = LEFT + col * (CELL_W + GAP);
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "#f3efe6";
        ctx.font = "600 12px 'Source Sans 3', sans-serif";
        ctx.fillText(`S${season.seasonNumber}`, x + CELL_W / 2, HEADER + 14);
        if (season.averageRating != null) {
          ctx.fillStyle = "#d7dde6";
          ctx.font = "11px 'Source Sans 3', sans-serif";
          ctx.fillText(
            season.averageRating.toFixed(1),
            x + CELL_W / 2,
            HEADER + 30,
          );
        }
        ctx.shadowBlur = 0;
      });
      ctx.textAlign = "left";

      for (let row = 0; row < rows; row++) {
        const y = TOP + row * (CELL_H + GAP);
        ctx.fillStyle = "#e8edf4";
        ctx.font = "12px 'Source Sans 3', sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = 4;
        ctx.fillText(String(row + 1), LEFT - 12, y + CELL_H / 2);
        ctx.shadowBlur = 0;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";

        for (let col = 0; col < cols; col++) {
          const season = seasons[col];
          const ep =
            season?.episodes.find((x) => x.episode === row + 1) ?? null;
          hitRef.current[row][col] = ep;
          const x = LEFT + col * (CELL_W + GAP);
          const band = ratingBand(ep?.rating ?? null);
          const dim =
            !!ep &&
            ep.rating != null &&
            minVotes > 0 &&
            (ep.votes ?? 0) < minVotes;

          if (!ep || ep.rating == null) {
            ctx.fillStyle = `rgba(255,255,255,${EMPTY_ALPHA})`;
            roundRect(ctx, x, y, CELL_W, CELL_H, 7);
            ctx.fill();
            continue;
          }

          const fill = lighten(colors[band], 0.22);
          const alpha = dim ? CELL_ALPHA * 0.45 : CELL_ALPHA;
          ctx.fillStyle = withAlpha(fill, alpha);
          roundRect(ctx, x, y, CELL_W, CELL_H, 7);
          ctx.fill();

          ctx.strokeStyle = withAlpha("#ffffff", 0.22);
          ctx.lineWidth = 1;
          roundRect(ctx, x, y, CELL_W, CELL_H, 7);
          ctx.stroke();

          ctx.fillStyle = "#101010";
          ctx.font = "700 13px 'Source Sans 3', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ep.rating.toFixed(1), x + CELL_W / 2, y + CELL_H / 2);
          ctx.textBaseline = "alphabetic";
          ctx.textAlign = "left";
        }
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e8b86d";
      ctx.font = "700 13px 'Source Sans 3', sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.fillText(`Image from ${BRAND}`, width / 2, height - FOOTER / 2);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    void paint();
    return () => {
      cancelled = true;
    };
  }, [
    show,
    seasons,
    rows,
    cols,
    width,
    height,
    dpr,
    minVotes,
    colorblind,
    backdropSrc,
  ]);

  function onClick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = layout.width / rect.width;
    const scaleY = layout.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const col = Math.floor((x - layout.left) / (layout.cellW + layout.gap));
    const row = Math.floor((y - layout.top) / (layout.cellH + layout.gap));
    if (col < 0 || row < 0 || col >= layout.cols || row >= layout.rows) return;
    const localX = x - layout.left - col * (layout.cellW + layout.gap);
    const localY = y - layout.top - row * (layout.cellH + layout.gap);
    if (localX > layout.cellW || localY > layout.cellH) return;
    const ep = hitRef.current[row]?.[col];
    if (ep && ep.rating != null) onSelect(ep);
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement("a");
      const slug = show.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.download = `${slug || show.imdbId}-ratings.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      window.alert(
        "Could not download this image (backdrop blocked by the image host). Try TMDB source or a browser that allows the download.",
      );
    }
  }

  return (
    <div
      className="heatmap-panel"
      role="region"
      aria-label={`${show.title} episode rating heatmap`}
    >
      <div className="heatmap-panel__toolbar">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={colorblind}
            onChange={onToggleColorblind}
          />
          Colorblind-safer palette
        </label>
        <button type="button" className="btn btn--primary" onClick={downloadPng}>
          Download image
        </button>
      </div>
      <div className="heatmap-canvas-wrap">
        <canvas ref={canvasRef} onClick={onClick} />
      </div>
    </div>
  );
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
