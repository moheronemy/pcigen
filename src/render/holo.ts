import type { Rect } from '../layout/layout';
import type { Holo, HoloArea, HoloStyle } from '../model/card';

const W = 400;
const H = 560;
/** 模様はカードの2倍の解像度で作り、2倍で書き出しても粗くならないようにする */
const RES = 2;
/** 枠画像の角の丸み */
const CORNER = 20;

/**
 * キラ加工をかける範囲を SVG のパス（400×560 のカード座標、evenodd）で表す。
 * Canvas の切り抜きと、プレビューの CSS マスクの両方で使う。
 */
export const holoPath = (area: HoloArea, win: Rect): string => {
  const r = CORNER;
  const card = `M${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H - r}A${r} ${r} 0 0 1 ${W - r} ${H}H${r}A${r} ${r} 0 0 1 0 ${H - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
  const art = `M${win.x} ${win.y}h${win.w}v${win.h}h${-win.w}Z`;
  switch (area) {
    case 'art':
      return art;
    case 'frame':
      return `${card}${art}`;
    case 'full':
      return card;
  }
};

/** 同じ模様が毎回描かれるよう、種を固定した乱数を使う */
const random = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const star = (ctx: Ctx, x: number, y: number, size: number) => {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x, y, x + size, y);
  ctx.quadraticCurveTo(x, y, x, y + size);
  ctx.quadraticCurveTo(x, y, x - size, y);
  ctx.quadraticCurveTo(x, y, x, y - size);
  ctx.fill();
};

const drawRainbow = (ctx: Ctx) => {
  const g = ctx.createLinearGradient(0, 0, W, H);
  const n = 24;
  for (let i = 0; i <= n; i++) g.addColorStop(i / n, `hsl(${(i * 45) % 360} 100% 62%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 箔の細かい筋
  ctx.lineWidth = 1.5;
  for (let d = -H; d < W + H; d += 5) {
    ctx.strokeStyle = d % 10 === 0 ? 'rgb(255 255 255 / 0.35)' : 'rgb(0 0 0 / 0.12)';
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + H * 0.6, H);
    ctx.stroke();
  }
};

const drawSwirl = (ctx: Ctx) => {
  const cx = W * 0.5;
  const cy = H * 0.3;
  const g = ctx.createConicGradient(0, cx, cy);
  const n = 36;
  for (let i = 0; i <= n; i++) g.addColorStop(i / n, `hsl(${(i * 30) % 360} 100% 62%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 同心円の帯
  ctx.lineWidth = 6;
  for (let r = 8; r < 720; r += 14) {
    ctx.strokeStyle = 'rgb(255 255 255 / 0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 中心から渦を巻いて広がる筋
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgb(255 255 255 / 0.35)';
  for (let k = 0; k < 90; k++) {
    const a0 = (k / 90) * Math.PI * 2;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.02) {
      const r = t * 720;
      const a = a0 + t * 2.2;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
  }
};

const drawCosmos = (ctx: Ctx) => {
  const rand = random(20260927);
  const g = ctx.createLinearGradient(0, H, W, 0);
  const n = 12;
  for (let i = 0; i <= n; i++) g.addColorStop(i / n, `hsl(${(i * 60 + 200) % 360} 90% 55%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 大小の泡
  for (let i = 0; i < 110; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 5 + rand() ** 2 * 38;
    const hue = Math.floor(rand() * 360);
    const bubble = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    bubble.addColorStop(0, `hsl(${hue} 100% 85% / 0.95)`);
    bubble.addColorStop(0.7, `hsl(${(hue + 40) % 360} 100% 60% / 0.6)`);
    bubble.addColorStop(1, `hsl(${(hue + 80) % 360} 100% 50% / 0)`);
    ctx.fillStyle = bubble;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 輪郭だけの輪
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `hsl(${Math.floor(rand() * 360)} 100% 85% / 0.7)`;
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, 6 + rand() * 24, 0, Math.PI * 2);
    ctx.stroke();
  }
  // きらめき
  ctx.fillStyle = 'rgb(255 255 255 / 0.9)';
  for (let i = 0; i < 70; i++) star(ctx, rand() * W, rand() * H, 1.5 + rand() * 5);
};

const DRAW: Record<Exclude<HoloStyle, 'none'>, (ctx: Ctx) => void> = {
  rainbow: drawRainbow,
  swirl: drawSwirl,
  cosmos: drawCosmos,
};

const cache = new Map<HoloStyle, CanvasImageSource>();

const createCanvas = (w: number, h: number) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** 模様を作る（一度作ったものは使い回す） */
export const holoPattern = (style: Exclude<HoloStyle, 'none'>): CanvasImageSource => {
  let pattern = cache.get(style);
  if (!pattern) {
    const canvas = createCanvas(W * RES, H * RES);
    const ctx = canvas.getContext('2d') as Ctx | null;
    if (!ctx) throw new Error('Canvas 2D が使えません');
    ctx.scale(RES, RES);
    DRAW[style](ctx);
    pattern = canvas;
    cache.set(style, pattern);
  }
  return pattern;
};

/**
 * キラ加工を重ねる。明るい部分が虹色に光るよう、薄く色を乗せてから overlay で強める。
 */
export const drawHolo = (ctx: CanvasRenderingContext2D, holo: Holo, win: Rect) => {
  if (holo.style === 'none' || holo.intensity <= 0) return;
  const pattern = holoPattern(holo.style);
  ctx.save();
  ctx.clip(new Path2D(holoPath(holo.area, win)), 'evenodd');
  ctx.globalAlpha = 0.2 * holo.intensity;
  ctx.drawImage(pattern, 0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.6 * holo.intensity;
  ctx.drawImage(pattern, 0, 0, W, H);
  ctx.restore();
};
