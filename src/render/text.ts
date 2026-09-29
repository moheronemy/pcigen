/** 行頭に来てはいけない文字（句読点・閉じ括弧・小書き文字・長音など） */
const NO_LINE_START = new Set(
  '、。，．,.・：；:;！？!?)）］]｝}」』】〕〉》ーぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ々〜～…‥',
);
/** 行末に来てはいけない文字（開き括弧） */
const NO_LINE_END = new Set('(（［[｛{「『【〔〈《');

export type Measure = (text: string) => number;

/**
 * 1文字ずつ幅を測りながら折り返す。英単語の途中でも折り返すが、禁則文字は前後の行に寄せる。
 * 明示的な改行（\n）はそのまま改行として扱う。
 */
export const wrapText = (text: string, maxWidth: number, measure: Measure): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const chars = Array.from(paragraph);
    let line: string[] = [];
    for (const ch of chars) {
      const next = [...line, ch];
      if (line.length === 0 || measure(next.join('')) <= maxWidth) {
        line = next;
        continue;
      }
      let carry: string[] = [];
      if (NO_LINE_START.has(ch)) {
        // 行頭禁則：前の行にぶら下げる
        line = next;
        lines.push(line.join(''));
        line = [];
        continue;
      }
      // 行末禁則：開き括弧は次の行へ送る
      while (line.length > 1 && NO_LINE_END.has(line[line.length - 1] ?? '')) {
        carry = [line.pop() as string, ...carry];
      }
      lines.push(line.join(''));
      line = [...carry, ch];
    }
    lines.push(line.join(''));
  }
  return lines;
};

export interface FitBox {
  w: number;
  h: number;
  size: number;
  lineHeight: number;
  /** これより小さくはしない */
  minSize: number;
}

export interface FitResult {
  size: number;
  lineHeight: number;
  lines: string[];
}

/** 1行目の高さ（文字の大きさ）＋残りの行の送り */
export const textBlockHeight = (lines: number, size: number, lineHeight: number) =>
  lines === 0 ? 0 : size + (lines - 1) * lineHeight;

/**
 * 枠の高さに収まるまで文字を少しずつ小さくする（行送りも同じ割合で縮める）。
 * 最小の大きさでも収まらないときは、最小の大きさで返す。
 * measureAt(size) はその文字の大きさで文字列の幅を測る関数を返す。
 */
export const fitText = (
  text: string,
  box: FitBox,
  measureAt: (size: number) => Measure,
  step = 0.25,
): FitResult => {
  let size = box.size;
  for (;;) {
    const lineHeight = box.lineHeight * (size / box.size);
    const lines = text ? wrapText(text, box.w, measureAt(size)) : [];
    const next = size - step;
    if (textBlockHeight(lines.length, size, lineHeight) <= box.h || next < box.minSize) {
      return { size, lineHeight, lines };
    }
    size = next;
  }
};
