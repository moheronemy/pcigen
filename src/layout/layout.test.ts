import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { availableTypes, createCard, SERIES, STAGES } from '../model/card';
import { getLayout, requiredAssets } from './layout';

const assetExists = (key: string) =>
  existsSync(fileURLToPath(new URL(`../assets/card/${key}.png`, import.meta.url)));

describe('getLayout', () => {
  const combos = SERIES.flatMap((series) =>
    STAGES.flatMap((stage) => availableTypes(series).map((type) => ({ series, stage, type }))),
  );

  it.each(combos)('$series / $stage / $type の素材がすべて揃っている', (c) => {
    const layout = getLayout({ ...createCard(), ...c, resistance: 'fire' });
    for (const key of requiredAssets(layout)) expect(assetExists(key), key).toBe(true);
  });

  it('シリーズとタイプから枠画像を選ぶ', () => {
    expect(getLayout({ ...createCard(), series: 'base', type: 'colorless' }).frame).toBe('pcard1');
    expect(getLayout({ ...createCard(), series: 'neo', type: 'darkness' }).frame).toBe('pcardneo8');
    expect(getLayout({ ...createCard(), series: 'e', type: 'metal' }).frame).toBe('pcarde9');
  });

  it('トレーナーは e だけ専用の枠', () => {
    const t = { ...createCard(), stage: 'trainer' as const };
    expect(getLayout({ ...t, series: 'base' }).frame).toBe('pcardtrainer');
    expect(getLayout({ ...t, series: 'neo' }).frame).toBe('pcardtrainer');
    expect(getLayout({ ...t, series: 'e' }).frame).toBe('pcardtrainere');
  });

  it('抵抗力の文字は初代で抵抗力があるときだけ重ねる', () => {
    expect(getLayout({ ...createCard(), resistance: 'fire' }).overlays).toContain('resistance');
    expect(getLayout(createCard()).overlays).not.toContain('resistance');
  });
});
