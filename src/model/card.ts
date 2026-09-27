export const SERIES = ['base', 'neo', 'e'] as const;
export type Series = (typeof SERIES)[number];

export const SERIES_LABELS: Record<Series, string> = {
  base: 'ポケットモンスターカードゲーム',
  neo: 'ポケモンカード★neo',
  e: 'ポケモンカードe',
};

export const STAGES = ['basic', 'stage1', 'stage2', 'trainer'] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  basic: 'たねポケモン',
  stage1: '1進化ポケモン',
  stage2: '2進化ポケモン',
  trainer: 'トレーナー',
};

/** 並び順はスプライト画像（sprite.png / type_sprite.png / button_sprite.png）の縦の並びと一致させる */
export const ENERGY_TYPES = [
  'colorless',
  'grass',
  'fire',
  'water',
  'lightning',
  'psychic',
  'fighting',
  'darkness',
  'metal',
] as const;
export type EnergyType = (typeof ENERGY_TYPES)[number];

export const ENERGY_LABELS: Record<EnergyType, string> = {
  colorless: '無',
  grass: '草',
  fire: '炎',
  water: '水',
  lightning: '雷',
  psychic: '超',
  fighting: '闘',
  darkness: '悪',
  metal: '鋼',
};

export const RARITIES = ['', '●', '◆', '★', '★★★'] as const;
export type Rarity = (typeof RARITIES)[number];

export const MAX_MOVES = 2;
export const MAX_RETREAT = 4;
export const MAX_COST = 4;

export interface Move {
  name: string;
  damage: string;
  text: string;
  cost: EnergyType[];
}

/** 画像の位置調整。x / y はカード座標での中央からのずれ、scale は枠にぴったり収まる大きさを 1 とした倍率 */
export interface Artwork {
  src: string | null;
  x: number;
  y: number;
  scale: number;
}

export interface CardData {
  series: Series;
  stage: Stage;
  type: EnergyType;
  name: string;
  hp: string;
  level: string;
  evolvesFrom: string;
  moves: Move[];
  weakness: EnergyType | null;
  resistance: EnergyType | null;
  resistanceValue: string;
  retreat: number;
  pokedex: string;
  info: string;
  trainerText: string;
  illustrator: string;
  copyright: string;
  number: string;
  rarity: Rarity;
  art: Artwork;
  evoArt: Artwork;
}

export const emptyMove = (): Move => ({ name: '', damage: '', text: '', cost: [] });

export const emptyArtwork = (): Artwork => ({ src: null, x: 0, y: 0, scale: 1 });

export const createCard = (): CardData => ({
  series: 'base',
  stage: 'basic',
  type: 'colorless',
  name: '',
  hp: '',
  level: '',
  evolvesFrom: '',
  moves: [emptyMove()],
  weakness: null,
  resistance: null,
  resistanceValue: '-30',
  retreat: 0,
  pokedex: '',
  info: '',
  trainerText: '',
  illustrator: '',
  copyright: '',
  number: '',
  rarity: '',
  art: emptyArtwork(),
  evoArt: emptyArtwork(),
});

/** 初代（base）には悪・鋼タイプが存在しない */
export const availableTypes = (series: Series): readonly EnergyType[] =>
  series === 'base' ? ENERGY_TYPES.filter((t) => t !== 'darkness' && t !== 'metal') : ENERGY_TYPES;

const isEnergyType = (v: unknown): v is EnergyType =>
  typeof v === 'string' && (ENERGY_TYPES as readonly string[]).includes(v);

/** シリーズ変更などで選べなくなった値を、選べる値に直す */
export const normalizeCard = (card: CardData): CardData => {
  const types = availableTypes(card.series);
  const fix = (t: EnergyType | null) => (t && !types.includes(t) ? null : t);
  return {
    ...card,
    type: types.includes(card.type) ? card.type : 'colorless',
    weakness: fix(card.weakness),
    resistance: fix(card.resistance),
    moves: card.moves.map((m) => ({ ...m, cost: m.cost.filter((c) => types.includes(c)) })),
  };
};

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const pick = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  (list as readonly unknown[]).includes(v) ? (v as T) : fallback;

const parseArtwork = (v: unknown): Artwork => {
  const o = (v ?? {}) as Record<string, unknown>;
  const num = (n: unknown, d: number) => (typeof n === 'number' && Number.isFinite(n) ? n : d);
  return {
    src: typeof o.src === 'string' ? o.src : null,
    x: num(o.x, 0),
    y: num(o.y, 0),
    scale: num(o.scale, 1),
  };
};

/** 保存データや読み込んだ JSON を、欠けや不正な値を補いながら CardData に変換する */
export const parseCard = (input: unknown): CardData => {
  const base = createCard();
  if (typeof input !== 'object' || input === null) return base;
  const o = input as Record<string, unknown>;
  const moves = Array.isArray(o.moves)
    ? o.moves.slice(0, MAX_MOVES).map((m): Move => {
        const mo = (m ?? {}) as Record<string, unknown>;
        return {
          name: str(mo.name),
          damage: str(mo.damage),
          text: str(mo.text),
          cost: Array.isArray(mo.cost) ? mo.cost.filter(isEnergyType).slice(0, MAX_COST) : [],
        };
      })
    : base.moves;
  const retreat = typeof o.retreat === 'number' ? o.retreat : 0;
  return normalizeCard({
    series: pick(SERIES, o.series, base.series),
    stage: pick(STAGES, o.stage, base.stage),
    type: isEnergyType(o.type) ? o.type : base.type,
    name: str(o.name),
    hp: str(o.hp),
    level: str(o.level),
    evolvesFrom: str(o.evolvesFrom),
    moves: moves.length > 0 ? moves : base.moves,
    weakness: isEnergyType(o.weakness) ? o.weakness : null,
    resistance: isEnergyType(o.resistance) ? o.resistance : null,
    resistanceValue: str(o.resistanceValue, base.resistanceValue),
    retreat: Math.max(0, Math.min(MAX_RETREAT, Math.trunc(retreat))),
    pokedex: str(o.pokedex),
    info: str(o.info),
    trainerText: str(o.trainerText),
    illustrator: str(o.illustrator),
    copyright: str(o.copyright),
    number: str(o.number),
    rarity: pick(RARITIES, o.rarity, base.rarity),
    art: parseArtwork(o.art),
    evoArt: parseArtwork(o.evoArt),
  });
};
