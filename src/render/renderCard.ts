import type { Layout, Rect, TextBox, IconSlot } from '../layout/layout';
import { ENERGY_TYPES, type Artwork, type CardData, type EnergyType } from '../model/card';
import type { ImageMap } from './assets';
import { wrapText } from './text';

export const CARD_WIDTH = 400;
export const CARD_HEIGHT = 560;
export const FONT_FAMILY = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif';

/** sprite.png の1アイコンの大きさ */
const SPRITE_CELL = 28;

export interface RenderImages {
  assets: ImageMap;
  art?: HTMLImageElement;
  evoArt?: HTMLImageElement;
}

const font = (size: number, weight = 700) => `${weight} ${size}px ${FONT_FAMILY}`;

/** 画像が枠いっぱいに収まるように置いたときの描画位置 */
export const artworkPlacement = (
  img: { width: number; height: number },
  win: Rect,
  art: Pick<Artwork, 'x' | 'y' | 'scale'>,
): Rect => {
  const s = Math.max(win.w / img.width, win.h / img.height) * art.scale;
  const w = img.width * s;
  const h = img.height * s;
  return { x: win.x + (win.w - w) / 2 + art.x, y: win.y + (win.h - h) / 2 + art.y, w, h };
};

const drawArtwork = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  win: Rect,
  art: Artwork,
  shape: 'rect' | 'circle',
) => {
  const p = artworkPlacement(img, win, art);
  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.ellipse(win.x + win.w / 2, win.y + win.h / 2, win.w / 2, win.h / 2, 0, 0, Math.PI * 2);
  } else {
    // 枠画像で隠れる程度に少し広めに切り抜く
    ctx.rect(win.x - 2, win.y - 2, win.w + 4, win.h + 4);
  }
  ctx.clip();
  ctx.drawImage(img, p.x, p.y, p.w, p.h);
  ctx.restore();
};

const drawEnergy = (
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement | undefined,
  type: EnergyType,
  x: number,
  y: number,
  size: number,
) => {
  if (!sprite) return;
  const sy = ENERGY_TYPES.indexOf(type) * SPRITE_CELL;
  ctx.drawImage(sprite, 0, sy, SPRITE_CELL, SPRITE_CELL, x, y, size, size);
};

const drawParagraph = (ctx: CanvasRenderingContext2D, text: string, box: TextBox, weight = 500) => {
  if (!text) return;
  ctx.font = font(box.size, weight);
  ctx.textAlign = 'left';
  const lines = wrapText(text, box.w, (t) => ctx.measureText(t).width);
  lines.forEach((line, i) => ctx.fillText(line, box.x, box.y + box.size + i * box.lineHeight));
};

const drawName = (ctx: CanvasRenderingContext2D, card: CardData, layout: Layout) => {
  const { name, level } = layout;
  ctx.font = font(name.size);
  ctx.textAlign = name.align;
  ctx.fillText(card.name, name.x, name.y, name.maxWidth);
  if (level && card.level && name.align === 'left') {
    const nameWidth = Math.min(ctx.measureText(card.name).width, name.maxWidth);
    ctx.font = font(level.size);
    ctx.textAlign = 'left';
    ctx.fillText(`LV.${card.level}`, name.x + nameWidth + 6, name.y);
  }
};

const drawHp = (ctx: CanvasRenderingContext2D, card: CardData, layout: Layout) => {
  if (!layout.hp || !card.hp) return;
  const { right, y } = layout.hp;
  ctx.textAlign = 'right';
  ctx.font = font(22);
  ctx.fillText(card.hp, right, y, 52);
  const w = Math.min(ctx.measureText(card.hp).width, 52);
  ctx.font = font(10);
  ctx.fillText('HP', right - w - 2, y);
};

const drawMoves = (
  ctx: CanvasRenderingContext2D,
  card: CardData,
  layout: Layout,
  sprite: HTMLImageElement | undefined,
) => {
  const m = layout.moves;
  if (!m || card.moves.length === 0) return;
  const slotH = (m.bottom - m.top) / card.moves.length;
  const textLineH = m.textSize + 3;

  card.moves.forEach((move, i) => {
    const slotTop = m.top + slotH * i;
    ctx.font = font(m.textSize, 500);
    const lines = move.text
      ? wrapText(move.text, m.textWidth, (t) => ctx.measureText(t).width)
      : [];
    const blockH = m.nameSize + (lines.length ? 4 + lines.length * textLineH : 0);
    const nameBaseline = slotTop + (slotH - blockH) / 2 + m.nameSize * 0.9;

    // エネルギー：2個ずつ並べ、名前の行の高さを中心にそろえる
    const rows = Math.ceil(move.cost.length / 2);
    const gap = 2;
    const gridH = rows * m.iconSize + (rows - 1) * gap;
    const gridTop = nameBaseline - m.nameSize * 0.35 - gridH / 2;
    move.cost.forEach((type, j) => {
      const x = m.iconX + (j % 2) * (m.iconSize + gap);
      const y = gridTop + Math.floor(j / 2) * (m.iconSize + gap);
      drawEnergy(ctx, sprite, type, x, y, m.iconSize);
    });

    ctx.textAlign = 'left';
    ctx.font = font(m.nameSize);
    ctx.fillText(move.name, m.nameX, nameBaseline, m.damageRight - m.nameX - 44);
    if (move.damage) {
      ctx.textAlign = 'right';
      ctx.fillText(move.damage, m.damageRight, nameBaseline, 60);
    }

    ctx.textAlign = 'left';
    ctx.font = font(m.textSize, 500);
    lines.forEach((line, k) =>
      ctx.fillText(line, m.textX, nameBaseline + 4 + m.textSize + k * textLineH),
    );

    if (m.divider && i > 0) {
      const y = Math.round(slotTop) + 0.5;
      ctx.save();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.divider[0], y);
      ctx.lineTo(m.divider[1], y);
      ctx.stroke();
      ctx.restore();
    }
  });
};

const drawStats = (
  ctx: CanvasRenderingContext2D,
  card: CardData,
  layout: Layout,
  sprite: HTMLImageElement | undefined,
) => {
  const s = layout.stats;
  if (!s) return;
  ctx.font = font(s.labelSize);
  ctx.textAlign = 'left';
  s.labels?.forEach((l) => ctx.fillText(l.text, l.x, l.y));

  const icon = (type: EnergyType, slot: IconSlot) =>
    drawEnergy(ctx, sprite, type, slot.x, slot.y, slot.size);
  if (card.weakness) icon(card.weakness, s.weakness);
  if (card.resistance) {
    icon(card.resistance, s.resistance);
    if (card.resistanceValue) {
      ctx.font = font(s.labelSize + 1);
      ctx.textAlign = s.resistanceValue.align;
      ctx.fillText(card.resistanceValue, s.resistanceValue.x, s.resistanceValue.y);
    }
  }
  for (let i = 0; i < card.retreat; i++) {
    drawEnergy(
      ctx,
      sprite,
      'colorless',
      s.retreat.x + i * s.retreat.step,
      s.retreat.y,
      s.retreat.size,
    );
  }
};

const drawFooter = (ctx: CanvasRenderingContext2D, card: CardData, layout: Layout) => {
  const f = layout.footer;
  ctx.font = font(f.size);
  if (card.illustrator) {
    ctx.textAlign = 'left';
    ctx.fillText(`Illus. ${card.illustrator}`, f.left, f.y);
  }
  if (card.copyright) {
    ctx.textAlign = 'center';
    ctx.fillText(card.copyright, (f.left + f.right) / 2, f.y);
  }
  const right = [card.number, card.rarity].filter(Boolean).join(' ');
  if (right) {
    ctx.textAlign = 'right';
    ctx.fillText(right, f.right, f.y);
  }
};

/**
 * カードを描画する。必要な素材画像は読み込み済みのものを渡す（この関数は同期的に描き切る）。
 * ctx は 400×560 のカード座標で描けるよう、呼び出し側で拡大率を設定しておく。
 */
export const renderCard = (
  ctx: CanvasRenderingContext2D,
  card: CardData,
  layout: Layout,
  images: RenderImages,
) => {
  const { assets } = images;
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.textBaseline = 'alphabetic';

  // イラスト枠（未設定なら白）
  const win = layout.artWindow;
  ctx.fillStyle = '#fff';
  ctx.fillRect(win.x, win.y, win.w, win.h);
  if (images.art) drawArtwork(ctx, images.art, win, card.art, 'rect');

  const frame = assets[layout.frame];
  if (frame) ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  for (const key of layout.overlays) {
    const img = assets[key];
    if (img) ctx.drawImage(img, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  }
  if (layout.evoWindow && images.evoArt) {
    drawArtwork(ctx, images.evoArt, layout.evoWindow, card.evoArt, layout.evoWindow.shape);
  }

  ctx.fillStyle = layout.textColor;
  const sprite = assets.sprite;

  drawName(ctx, card, layout);
  if (layout.evolvesFrom && card.evolvesFrom) {
    const e = layout.evolvesFrom;
    ctx.font = font(e.size);
    ctx.textAlign = 'left';
    ctx.fillText(`${card.evolvesFrom}から進化`, e.x, e.y);
  }
  drawHp(ctx, card, layout);
  if (layout.info && card.info) {
    const i = layout.info;
    ctx.font = font(i.size);
    ctx.textAlign = 'center';
    ctx.fillText(card.info, i.x, i.y, i.maxWidth);
  }
  drawMoves(ctx, card, layout, sprite);
  drawStats(ctx, card, layout, sprite);
  if (layout.pokedex) drawParagraph(ctx, card.pokedex, layout.pokedex);
  if (layout.trainerText) drawParagraph(ctx, card.trainerText, layout.trainerText);
  drawFooter(ctx, card, layout);
};

/** カードに描かれる文字をすべて集める（Web フォントの読み込みに使う） */
export const cardText = (card: CardData): string =>
  [
    card.name,
    card.hp,
    card.level,
    card.evolvesFrom,
    card.info,
    card.pokedex,
    card.trainerText,
    card.illustrator,
    card.copyright,
    card.number,
    card.rarity,
    card.resistanceValue,
    ...card.moves.flatMap((m) => [m.name, m.damage, m.text]),
    'HPLV.Illus.から進化弱点抵抗力にげる0123456789',
  ].join('');
