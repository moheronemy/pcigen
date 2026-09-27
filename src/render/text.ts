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
