import type { Layout } from './layout';

/** 確認モードで色分けする種類 */
export type GuideGroup = 'image' | 'text' | 'icon' | 'area';

export type Guide =
  | {
      kind: 'rect';
      label: string;
      group: GuideGroup;
      x: number;
      y: number;
      w: number;
      h: number;
      shape?: 'rect' | 'circle';
    }
  | {
      kind: 'line';
      label: string;
      group: GuideGroup;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };

const rect = (
  label: string,
  group: GuideGroup,
  x: number,
  y: number,
  w: number,
  h: number,
  shape?: 'rect' | 'circle',
): Guide => ({ kind: 'rect', label, group, x, y, w, h, shape });

const vline = (label: string, group: GuideGroup, x: number, y1: number, y2: number): Guide => ({
  kind: 'line',
  label,
  group,
  x1: x,
  y1,
  x2: x,
  y2,
});

/** 文字の位置（ベースライン）と揃え方から、文字が入る範囲を求める */
const textRect = (
  label: string,
  x: number,
  baseline: number,
  size: number,
  width: number,
  align: 'left' | 'center' | 'right',
): Guide => {
  const left = align === 'left' ? x : align === 'center' ? x - width / 2 : x - width;
  return rect(label, 'text', left, baseline - size, width, size);
};

/**
 * レイアウトの座標を、プレビューに重ねて描くための枠と線に変換する。
 * 文字の幅が決まっていないもの（進化元など）は、目安の幅で表す。
 */
export const layoutGuides = (layout: Layout): Guide[] => {
  const g: Guide[] = [];
  const a = layout.artWindow;
  g.push(rect('イラスト', 'image', a.x, a.y, a.w, a.h));
  if (layout.evoWindow) {
    const e = layout.evoWindow;
    g.push(rect('進化前', 'image', e.x, e.y, e.w, e.h, e.shape));
  }

  const n = layout.name;
  g.push(textRect('カード名', n.x, n.y, n.size, n.maxWidth, n.align));
  if (layout.evolvesFrom) {
    const e = layout.evolvesFrom;
    g.push(textRect('進化元', e.x, e.y, e.size, 120, 'left'));
  }
  if (layout.hp) g.push(textRect('HP', layout.hp.right, layout.hp.y, 22, 70, 'right'));
  if (layout.info) {
    const i = layout.info;
    g.push(textRect('種類・たかさ・おもさ', i.x, i.y, i.size, i.maxWidth, 'center'));
  }

  const m = layout.moves;
  if (m) {
    g.push(rect('わざ欄', 'area', m.iconX, m.top, m.damageRight - m.iconX, m.bottom - m.top));
    g.push(vline('エネルギー', 'icon', m.iconX + m.iconSize * 2 + 2, m.top, m.bottom));
    g.push(vline('わざ名', 'text', m.nameX, m.top, m.bottom));
    g.push(vline('説明の右端', 'text', m.textX + m.textWidth, m.top, m.bottom));
    g.push(vline('ダメージの右端', 'text', m.damageRight, m.top, m.bottom));
  }

  const s = layout.stats;
  if (s) {
    const icon = (
      label: string,
      slot: { x: number; y: number; size: number },
      count = 1,
      step = 0,
    ) => rect(label, 'icon', slot.x, slot.y, slot.size + step * (count - 1), slot.size);
    g.push(icon('弱点', s.weakness));
    g.push(icon('抵抗力', s.resistance));
    g.push(icon('にげる', s.retreat, 4, s.retreat.step));
    g.push(
      textRect(
        '抵抗力の値',
        s.resistanceValue.x,
        s.resistanceValue.y,
        s.labelSize + 1,
        18,
        s.resistanceValue.align,
      ),
    );
  }

  if (layout.pokedex) {
    const p = layout.pokedex;
    g.push(rect('ずかん', 'area', p.x, p.y, p.w, p.h));
  }
  if (layout.trainerText) {
    const t = layout.trainerText;
    g.push(rect('効果', 'area', t.x, t.y, t.w, t.h));
  }

  const f = layout.footer;
  g.push(
    rect(
      '下部（イラストレーター・著作権・番号）',
      'text',
      f.left,
      f.y - f.size,
      f.right - f.left,
      f.size,
    ),
  );
  return g;
};
