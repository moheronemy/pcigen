import { describe, expect, it } from 'vitest';
import { createCard, MAX_COST, MAX_MOVES } from '../model/card';
import { cardReducer, MAX_ART_SCALE } from './cardReducer';

describe('cardReducer', () => {
  it('わざは最大数まで追加でき、最後の1つは消せない', () => {
    let card = createCard();
    for (let i = 0; i < 5; i++) card = cardReducer(card, { type: 'addMove' });
    expect(card.moves).toHaveLength(MAX_MOVES);
    for (let i = 0; i < 5; i++) card = cardReducer(card, { type: 'removeMove', index: 0 });
    expect(card.moves).toHaveLength(1);
  });

  it('エネルギーは最大数まで積め、後ろから消せる', () => {
    let card = createCard();
    for (let i = 0; i < 6; i++)
      card = cardReducer(card, { type: 'addCost', index: 0, energy: 'fire' });
    expect(card.moves[0]?.cost).toHaveLength(MAX_COST);
    card = cardReducer(card, { type: 'popCost', index: 0 });
    expect(card.moves[0]?.cost).toHaveLength(MAX_COST - 1);
  });

  it('シリーズ変更で選べない値を直す', () => {
    let card = cardReducer(createCard(), { type: 'set', patch: { series: 'neo', type: 'metal' } });
    expect(card.type).toBe('metal');
    card = cardReducer(card, { type: 'set', patch: { series: 'base' } });
    expect(card.type).toBe('colorless');
  });

  it('画像の移動は差分を足し、拡大率は上限で止まる', () => {
    let card = cardReducer(createCard(), { type: 'moveArt', key: 'art', dx: 3, dy: -2 });
    card = cardReducer(card, { type: 'moveArt', key: 'art', dx: 1, dy: 1 });
    expect(card.art).toMatchObject({ x: 4, y: -1 });
    card = cardReducer(card, { type: 'zoomArt', key: 'art', factor: 100 });
    expect(card.art.scale).toBe(MAX_ART_SCALE);
  });
});

describe('cardReducer のキラ加工', () => {
  it('キラ加工の設定を部分的に変えられる', () => {
    const card = cardReducer(createCard(), { type: 'setHolo', patch: { style: 'swirl' } });
    expect(card.holo).toMatchObject({ style: 'swirl', area: 'art' });
  });
});

describe('cardReducer のポケパワー・ポケボディー', () => {
  it('部分的に変えられる', () => {
    let card = cardReducer(createCard(), { type: 'setAbility', patch: { kind: 'pokebody' } });
    card = cardReducer(card, { type: 'setAbility', patch: { name: 'あついからだ' } });
    expect(card.ability).toEqual({ kind: 'pokebody', name: 'あついからだ', text: '' });
  });
});
