import { describe, expect, it } from 'vitest';
import { wrapText } from './text';

// 1文字 = 幅 10 として測る
const measure = (t: string) => Array.from(t).length * 10;

describe('wrapText', () => {
  it('幅に収まる文字列はそのまま1行', () => {
    expect(wrapText('たいあたり', 100, measure)).toEqual(['たいあたり']);
  });

  it('幅を超えたら折り返す', () => {
    expect(wrapText('あいうえおかきくけこさ', 50, measure)).toEqual([
      'あいうえお',
      'かきくけこ',
      'さ',
    ]);
  });

  it('改行はそのまま残す', () => {
    expect(wrapText('あい\nうえ', 100, measure)).toEqual(['あい', 'うえ']);
  });

  it('句読点は行頭に来ないよう前の行にぶら下げる', () => {
    expect(wrapText('あいうえお。かき', 50, measure)).toEqual(['あいうえお。', 'かき']);
  });

  it('開き括弧は行末に残さず次の行へ送る', () => {
    expect(wrapText('あいうえ「おか」', 50, measure)).toEqual(['あいうえ', '「おか」']);
  });

  it('空文字は空行1つ', () => {
    expect(wrapText('', 50, measure)).toEqual(['']);
  });
});
