import { getLayout, requiredAssets } from '../layout/layout';
import type { CardData } from '../model/card';
import { loadAssets, loadImage } from './assets';
import { ensureFonts } from './fonts';
import { CARD_HEIGHT, CARD_WIDTH, cardText, renderCard, type RenderImages } from './renderCard';

/** 描画に必要な画像とフォントをすべて読み込む */
export const prepareCard = async (card: CardData): Promise<RenderImages> => {
  const layout = getLayout(card);
  const [assets, art, evoArt] = await Promise.all([
    loadAssets(requiredAssets(layout)),
    card.art.src ? loadImage(card.art.src) : undefined,
    layout.evoWindow && card.evoArt.src ? loadImage(card.evoArt.src) : undefined,
    ensureFonts(cardText(card)),
  ]);
  return { assets, art, evoArt };
};

/** canvas の大きさを scale 倍にして、カードを描く */
export const drawCard = (
  canvas: HTMLCanvasElement,
  card: CardData,
  images: RenderImages,
  scale = 1,
) => {
  canvas.width = CARD_WIDTH * scale;
  canvas.height = CARD_HEIGHT * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D が使えません');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  renderCard(ctx, card, getLayout(card), images);
};

/** PNG として書き出す */
export const exportPng = async (card: CardData, scale: number): Promise<Blob> => {
  const images = await prepareCard(card);
  const canvas = document.createElement('canvas');
  drawCard(canvas, card, images, scale);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('PNG を作れませんでした'))),
      'image/png',
    ),
  );
};
