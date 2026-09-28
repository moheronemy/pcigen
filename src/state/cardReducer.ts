import {
  createCard,
  emptyArtwork,
  emptyMove,
  MAX_COST,
  MAX_MOVES,
  normalizeCard,
  type Ability,
  type Artwork,
  type Holo,
  type CardData,
  type EnergyType,
  type Move,
} from '../model/card';

export type ArtKey = 'art' | 'evoArt';

export const MIN_ART_SCALE = 0.5;
export const MAX_ART_SCALE = 4;

const clampScale = (s: number) => Math.min(MAX_ART_SCALE, Math.max(MIN_ART_SCALE, s));

export type CardAction =
  | { type: 'set'; patch: Partial<CardData> }
  | { type: 'setAbility'; patch: Partial<Ability> }
  | { type: 'setMove'; index: number; patch: Partial<Move> }
  | { type: 'addMove' }
  | { type: 'removeMove'; index: number }
  | { type: 'addCost'; index: number; energy: EnergyType }
  | { type: 'popCost'; index: number }
  | { type: 'setArt'; key: ArtKey; patch: Partial<Artwork> }
  | { type: 'moveArt'; key: ArtKey; dx: number; dy: number }
  | { type: 'zoomArt'; key: ArtKey; factor: number }
  | { type: 'clearArt'; key: ArtKey }
  | { type: 'setHolo'; patch: Partial<Holo> }
  | { type: 'replace'; card: CardData }
  | { type: 'reset' };

const updateMove = (card: CardData, index: number, f: (m: Move) => Move): CardData => ({
  ...card,
  moves: card.moves.map((m, i) => (i === index ? f(m) : m)),
});

export const cardReducer = (card: CardData, action: CardAction): CardData => {
  switch (action.type) {
    case 'set':
      return normalizeCard({ ...card, ...action.patch });
    case 'setAbility':
      return { ...card, ability: { ...card.ability, ...action.patch } };
    case 'setMove':
      return updateMove(card, action.index, (m) => ({ ...m, ...action.patch }));
    case 'addMove':
      return card.moves.length >= MAX_MOVES
        ? card
        : { ...card, moves: [...card.moves, emptyMove()] };
    case 'removeMove':
      return card.moves.length <= 1
        ? card
        : { ...card, moves: card.moves.filter((_, i) => i !== action.index) };
    case 'addCost':
      return updateMove(card, action.index, (m) =>
        m.cost.length >= MAX_COST ? m : { ...m, cost: [...m.cost, action.energy] },
      );
    case 'popCost':
      return updateMove(card, action.index, (m) => ({ ...m, cost: m.cost.slice(0, -1) }));
    case 'setArt':
      return { ...card, [action.key]: { ...card[action.key], ...action.patch } };
    case 'moveArt': {
      const art = card[action.key];
      return { ...card, [action.key]: { ...art, x: art.x + action.dx, y: art.y + action.dy } };
    }
    case 'zoomArt': {
      const art = card[action.key];
      return { ...card, [action.key]: { ...art, scale: clampScale(art.scale * action.factor) } };
    }
    case 'clearArt':
      return { ...card, [action.key]: emptyArtwork() };
    case 'setHolo':
      return { ...card, holo: { ...card.holo, ...action.patch } };
    case 'replace':
      return action.card;
    case 'reset':
      return createCard();
  }
};
