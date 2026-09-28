import { ENERGY_TYPES, supportsAbility, type CardData } from '../model/card';

/**
 * カード上の配置（400×560px のカード座標）。
 * 座標は素材画像から測ったもの。見た目を調整したいときはこのファイルの数値を変える。
 */

export type TextAlign = 'left' | 'center' | 'right';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextBox extends Rect {
  size: number;
  lineHeight: number;
}

export interface IconSlot {
  x: number;
  y: number;
  size: number;
}

export interface MovesLayout {
  top: number;
  bottom: number;
  iconX: number;
  iconSize: number;
  nameX: number;
  nameSize: number;
  damageRight: number;
  textX: number;
  textWidth: number;
  textSize: number;
  /** 2つのわざの間に引く区切り線（x の範囲） */
  divider?: [number, number];
  /** ポケパワー・ポケボディー（わざの上に置く） */
  ability?: {
    /** 「ポケパワー」「ポケボディー」の見出し画像 */
    badge: string;
    badgeHeight: number;
  };
}

export interface StatsLayout {
  /** 枠画像に文字が入っていないシリーズでは、ラベルを描き足す */
  labels?: { text: string; x: number; y: number }[];
  labelSize: number;
  weakness: IconSlot;
  resistance: IconSlot;
  resistanceValue: { x: number; y: number; align: TextAlign };
  retreat: IconSlot & { step: number };
}

export interface Layout {
  frame: string;
  overlays: string[];
  textColor: string;
  artWindow: Rect;
  evoWindow?: Rect & { shape: 'rect' | 'circle' };
  name: { x: number; y: number; size: number; maxWidth: number; align: TextAlign };
  level?: { size: number };
  evolvesFrom?: { x: number; y: number; size: number };
  hp?: { right: number; y: number };
  info?: { x: number; y: number; size: number; maxWidth: number };
  moves?: MovesLayout;
  stats?: StatsLayout;
  pokedex?: TextBox;
  trainerText?: TextBox;
  footer: { y: number; left: number; right: number; size: number };
}

const typeIndex = (card: CardData) => ENERGY_TYPES.indexOf(card.type) + 1;

const baseTrainer = (): Layout => ({
  frame: 'pcardtrainer',
  overlays: [],
  textColor: '#000',
  artWindow: { x: 35, y: 132, w: 331, h: 179 },
  name: { x: 200, y: 121, size: 24, maxWidth: 320, align: 'center' },
  trainerText: { x: 64, y: 356, w: 272, h: 150, size: 11, lineHeight: 15 },
  footer: { y: 541, left: 36, right: 364, size: 7 },
});

const eTrainer = (): Layout => ({
  frame: 'pcardtrainere',
  overlays: [],
  textColor: '#000',
  artWindow: { x: 47, y: 97, w: 309, h: 183 },
  name: { x: 58, y: 85, size: 22, maxWidth: 290, align: 'left' },
  trainerText: { x: 76, y: 314, w: 272, h: 168, size: 10, lineHeight: 14 },
  footer: { y: 521, left: 72, right: 372, size: 7 },
});

const basePokemon = (card: CardData): Layout => {
  const evolved = card.stage === 'stage1' || card.stage === 'stage2';
  return {
    frame: `pcard${typeIndex(card)}`,
    overlays: [
      ...(evolved ? [card.stage === 'stage1' ? 'stage1' : 'stage2'] : []),
      ...(card.resistance ? ['resistance'] : []),
    ],
    textColor: '#000',
    artWindow: { x: 45, y: 76, w: 312, h: 219 },
    evoWindow: evolved ? { x: 29, y: 33, w: 53, h: 44, shape: 'rect' } : undefined,
    name: { x: evolved ? 100 : 40, y: 60, size: 25, maxWidth: evolved ? 150 : 210, align: 'left' },
    level: { size: 11 },
    evolvesFrom: evolved ? { x: 92, y: 26, size: 10 } : undefined,
    hp: { right: 335, y: 60 },
    info: { x: 200, y: 321, size: 10, maxWidth: 270 },
    moves: {
      top: 330,
      bottom: 434,
      iconX: 40,
      iconSize: 24,
      nameX: 100,
      nameSize: 20,
      damageRight: 358,
      textX: 100,
      textWidth: 255,
      textSize: 9,
      divider: [36, 362],
    },
    stats: {
      labelSize: 9,
      weakness: { x: 54, y: 473, size: 18 },
      resistance: { x: 54, y: 503, size: 18 },
      resistanceValue: { x: 130, y: 516, align: 'center' },
      retreat: { x: 68, y: 444, size: 18, step: 20 },
    },
    pokedex: { x: 246, y: 457, w: 110, h: 60, size: 9, lineHeight: 11 },
    footer: { y: 541, left: 36, right: 364, size: 7 },
  };
};

const neoPokemon = (card: CardData): Layout => {
  const evolved = card.stage === 'stage1' || card.stage === 'stage2';
  return {
    frame: `pcardneo${typeIndex(card)}`,
    overlays: evolved ? [card.stage === 'stage1' ? 'stageneo1' : 'stageneo2'] : [],
    textColor: card.type === 'darkness' ? '#fff' : '#000',
    artWindow: { x: 36, y: 78, w: 326, h: 205 },
    evoWindow: evolved ? { x: 15, y: 30, w: 48, h: 46, shape: 'circle' } : undefined,
    name: { x: evolved ? 100 : 36, y: 64, size: 24, maxWidth: evolved ? 150 : 210, align: 'left' },
    level: { size: 11 },
    evolvesFrom: evolved ? { x: 100, y: 27, size: 10 } : undefined,
    hp: { right: 336, y: 62 },
    info: { x: 197, y: 305, size: 10, maxWidth: 260 },
    moves: {
      top: 316,
      bottom: 460,
      iconX: 36,
      iconSize: 24,
      nameX: 96,
      nameSize: 20,
      damageRight: 362,
      textX: 96,
      textWidth: 262,
      textSize: 9,
    },
    stats: {
      labels: [
        { text: '弱点', x: 38, y: 481 },
        { text: '抵抗力', x: 88, y: 481 },
        { text: 'にげる', x: 142, y: 481 },
      ],
      labelSize: 8,
      weakness: { x: 40, y: 488, size: 18 },
      resistance: { x: 88, y: 488, size: 18 },
      resistanceValue: { x: 108, y: 501, align: 'left' },
      retreat: { x: 142, y: 488, size: 18, step: 19 },
    },
    pokedex: { x: 222, y: 486, w: 142, h: 38, size: 8, lineHeight: 10 },
    footer: { y: 540, left: 36, right: 364, size: 7 },
  };
};

const ePokemon = (card: CardData): Layout => {
  const evolved = card.stage === 'stage1' || card.stage === 'stage2';
  return {
    frame: `pcarde${typeIndex(card)}`,
    overlays: evolved ? [card.stage === 'stage1' ? 'stagee1' : 'stagee2'] : [],
    textColor: card.type === 'darkness' ? '#fff' : '#000',
    artWindow: { x: 46, y: 71, w: 338, h: 201 },
    evoWindow: evolved ? { x: 48, y: 30, w: 46, h: 43, shape: 'circle' } : undefined,
    name: { x: evolved ? 104 : 58, y: 58, size: 22, maxWidth: evolved ? 150 : 190, align: 'left' },
    level: { size: 10 },
    evolvesFrom: evolved ? { x: 108, y: 27, size: 8 } : undefined,
    hp: { right: 344, y: 58 },
    info: { x: 252, y: 282, size: 9, maxWidth: 240 },
    moves: {
      top: 290,
      bottom: 440,
      iconX: 58,
      iconSize: 24,
      nameX: 116,
      nameSize: 19,
      damageRight: 372,
      textX: 116,
      textWidth: 254,
      textSize: 9,
      ability:
        supportsAbility(card) && card.ability.kind !== 'none'
          ? { badge: card.ability.kind, badgeHeight: 19 }
          : undefined,
    },
    stats: {
      labels: [
        { text: '弱点', x: 60, y: 463 },
        { text: 'にげる', x: 196, y: 463 },
        { text: '抵抗力', x: 112, y: 463 },
      ],
      labelSize: 8,
      weakness: { x: 80, y: 451, size: 16 },
      resistance: { x: 139, y: 451, size: 16 },
      resistanceValue: { x: 157, y: 463, align: 'left' },
      retreat: { x: 223, y: 451, size: 16, step: 17 },
    },
    pokedex: { x: 215, y: 480, w: 158, h: 36, size: 8, lineHeight: 10 },
    footer: { y: 523, left: 90, right: 372, size: 7 },
  };
};

export const getLayout = (card: CardData): Layout => {
  if (card.stage === 'trainer') return card.series === 'e' ? eTrainer() : baseTrainer();
  switch (card.series) {
    case 'base':
      return basePokemon(card);
    case 'neo':
      return neoPokemon(card);
    case 'e':
      return ePokemon(card);
  }
};

/** 描画に必要な素材画像の名前 */
export const requiredAssets = (layout: Layout): string[] => [
  layout.frame,
  ...layout.overlays,
  ...(layout.moves || layout.stats ? ['sprite'] : []),
  ...(layout.moves?.ability ? [layout.moves.ability.badge] : []),
];
