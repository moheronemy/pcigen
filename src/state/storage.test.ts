import { describe, expect, it } from 'vitest';
import { safeFilename } from './storage';

describe('safeFilename', () => {
  it('日本語のカード名はそのまま使う', () => {
    expect(safeFilename('ゴースト', 'png')).toBe('ゴースト.png');
  });

  it('ファイル名に使えない文字と空白は _ に置き換える', () => {
    expect(safeFilename('ニドラン♀ a/b:c', 'png')).toBe('ニドラン♀_a_b_c.png');
  });

  it('空なら card', () => {
    expect(safeFilename('  ', 'json')).toBe('card.json');
  });
});
