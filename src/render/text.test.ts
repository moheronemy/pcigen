import { describe, expect, it } from 'vitest';
import { fitText, textBlockHeight, wrapText } from './text';

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

describe('fitText', () => {
  // 文字の大きさ = 1文字の幅 として測る
  const measureAt = (size: number) => (t: string) => Array.from(t).length * size;
  const box = { w: 100, h: 30, size: 10, lineHeight: 12, minSize: 6 };

  it('収まるときは元の大きさのまま', () => {
    expect(fitText('あいうえお', box, measureAt)).toEqual({
      size: 10,
      lineHeight: 12,
      lines: ['あいうえお'],
    });
  });

  it('収まらないときは、収まるまで文字と行送りを小さくする', () => {
    // 10px だと 30 文字 = 3行（高さ 10 + 2×12 = 34 > 30）
    const r = fitText('あ'.repeat(30), box, measureAt);
    expect(r.size).toBeLessThan(10);
    expect(r.lineHeight / r.size).toBeCloseTo(1.2);
    expect(textBlockHeight(r.lines.length, r.size, r.lineHeight)).toBeLessThanOrEqual(box.h);
  });

  it('最小の大きさでも収まらないときは最小の大きさで返す', () => {
    const r = fitText('あ'.repeat(500), box, measureAt);
    expect(r.size).toBe(6);
  });

  it('空文字は行なし', () => {
    expect(fitText('', box, measureAt).lines).toEqual([]);
  });
});
