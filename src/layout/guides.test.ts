import { describe, expect, it } from 'vitest';
import { createCard, SERIES, STAGES } from '../model/card';
import { layoutGuides } from './guides';
import { getLayout } from './layout';

const labels = (card: Parameters<typeof getLayout>[0]) =>
  layoutGuides(getLayout(card)).map((g) => g.label);

describe('layoutGuides', () => {
  it('ポケモンにはわざ欄・弱点などの枠が出る', () => {
    const l = labels({ ...createCard(), stage: 'stage1' });
    expect(l).toEqual(
      expect.arrayContaining([
        'イラスト',
        '進化前',
        'カード名',
        'HP',
        'わざ欄',
        'にげる',
        'ずかん',
      ]),
    );
    expect(l).not.toContain('効果');
  });

  it('たねポケモンには進化前の枠が出ない', () => {
    expect(labels(createCard())).not.toContain('進化前');
  });

  it('トレーナーには効果の枠が出て、わざ欄は出ない', () => {
    const l = labels({ ...createCard(), stage: 'trainer' });
    expect(l).toContain('効果');
    expect(l).not.toContain('わざ欄');
  });

  it.each(SERIES.flatMap((series) => STAGES.map((stage) => ({ series, stage }))))(
    '$series / $stage の枠はカードの中に収まる',
    (c) => {
      for (const g of layoutGuides(getLayout({ ...createCard(), ...c }))) {
        const [x1, y1, x2, y2] =
          g.kind === 'rect' ? [g.x, g.y, g.x + g.w, g.y + g.h] : [g.x1, g.y1, g.x2, g.y2];
        expect(Math.min(x1, x2), g.label).toBeGreaterThanOrEqual(0);
        expect(Math.min(y1, y2), g.label).toBeGreaterThanOrEqual(0);
        expect(Math.max(x1, x2), g.label).toBeLessThanOrEqual(400);
        expect(Math.max(y1, y2), g.label).toBeLessThanOrEqual(560);
      }
    },
  );
});
