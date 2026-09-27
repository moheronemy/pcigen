import '@fontsource/noto-sans-jp/500.css';
import '@fontsource/noto-sans-jp/700.css';

/**
 * Canvas は Web フォントの読み込みを待たずに代替フォントで描いてしまうので、
 * 描く文字が含まれるサブセットを先に読み込んでおく。
 */
export const ensureFonts = async (text: string): Promise<void> => {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all(
      [500, 700].map((w) => document.fonts.load(`${w} 16px "Noto Sans JP"`, text || 'あ')),
    );
  } catch {
    // 読み込みに失敗しても代替フォントで描ける
  }
};
