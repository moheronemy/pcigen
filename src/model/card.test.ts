import { describe, expect, it } from 'vitest';
import { availableTypes, createCard, normalizeCard, parseCard } from './card';

describe('availableTypes', () => {
  it('初代には悪・鋼がない', () => {
    expect(availableTypes('base')).not.toContain('darkness');
    expect(availableTypes('base')).not.toContain('metal');
    expect(availableTypes('neo')).toContain('darkness');
  });
});

describe('normalizeCard', () => {
  it('初代に切り替えると悪・鋼の値が直る', () => {
    const card = normalizeCard({
      ...createCard(),
      series: 'base',
      type: 'darkness',
      weakness: 'metal',
      resistance: 'fire',
      moves: [{ name: '', damage: '', text: '', cost: ['darkness', 'fire'] }],
    });
    expect(card.type).toBe('colorless');
    expect(card.weakness).toBeNull();
    expect(card.resistance).toBe('fire');
    expect(card.moves[0]?.cost).toEqual(['fire']);
  });
});

describe('parseCard', () => {
  it('不正な入力なら初期値', () => {
    expect(parseCard(null)).toEqual(createCard());
    expect(parseCard('abc')).toEqual(createCard());
  });

  it('書き出したデータを元に戻せる', () => {
    const card = { ...createCard(), series: 'neo' as const, name: 'ゴースト', retreat: 2 };
    expect(parseCard(JSON.parse(JSON.stringify(card)))).toEqual(card);
  });

  it('範囲外や型違いの値は補正する', () => {
    const card = parseCard({
      series: 'xyz',
      retreat: 99,
      rarity: '?',
      moves: [{ name: 1, cost: ['fire', 'nope'] }, {}, {}],
      art: { src: 'data:x', scale: 'big' },
    });
    expect(card.series).toBe('base');
    expect(card.retreat).toBe(4);
    expect(card.rarity).toBe('');
    expect(card.moves).toHaveLength(2);
    expect(card.moves[0]).toEqual({ name: '', damage: '', text: '', cost: ['fire'] });
    expect(card.art).toEqual({ src: 'data:x', x: 0, y: 0, scale: 1 });
  });
});

describe('parseCard のキラ加工', () => {
  it('キラ加工のない古い保存データは「なし」になる', () => {
    expect(parseCard({ name: 'ゴースト' }).holo).toEqual(createCard().holo);
  });

  it('不正な値は補正し、強さは 0〜1 に収める', () => {
    expect(parseCard({ holo: { style: 'cosmos', area: 'x', intensity: 5 } }).holo).toEqual({
      style: 'cosmos',
      area: 'art',
      intensity: 1,
    });
  });
});
