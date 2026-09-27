import { useEffect, useReducer, useRef, useState } from 'react';
import { parseCard } from './model/card';
import { exportPng } from './render/draw';
import { cardReducer } from './state/cardReducer';
import {
  downloadBlob,
  loadSavedCard,
  safeFilename,
  saveCard,
  type SaveResult,
} from './state/storage';
import { Editor } from './ui/Editor';
import { Preview } from './ui/Preview';

const SAVE_MESSAGES: Record<Exclude<SaveResult, 'saved'>, string> = {
  savedWithoutImages: '画像が大きいため、画像以外の入力内容だけをこのブラウザに保存しています。',
  failed: 'このブラウザには入力内容を保存できません。',
};

export const App = () => {
  const [card, dispatch] = useReducer(cardReducer, undefined, loadSavedCard);
  const [saveResult, setSaveResult] = useState<SaveResult>('saved');
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // 入力内容を自動保存する（連続入力中は少し待つ）
  useEffect(() => {
    const t = setTimeout(() => setSaveResult(saveCard(card)), 400);
    return () => clearTimeout(t);
  }, [card]);

  const onDownload = async () => {
    setBusy(true);
    setMessage(null);
    try {
      downloadBlob(await exportPng(card, scale), safeFilename(card.name, 'png'));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onExportJson = () => {
    const blob = new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' });
    downloadBlob(blob, safeFilename(card.name, 'json'));
  };

  const onImportJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      dispatch({ type: 'replace', card: parseCard(JSON.parse(await file.text())) });
      setMessage(null);
    } catch {
      setMessage('JSON を読み込めませんでした。このツールで書き出したファイルか確認してください。');
    }
  };

  const onReset = () => {
    if (window.confirm('入力内容をすべて消して、最初からやり直しますか？')) {
      dispatch({ type: 'reset' });
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1>旧裏カードジェネレーター</h1>
      </header>

      <main className="main">
        <section className="preview-pane" aria-label="プレビュー">
          <Preview card={card} dispatch={dispatch} />
          <div className="actions">
            <div className="row">
              <button type="button" className="primary" onClick={onDownload} disabled={busy}>
                {busy ? '作成中…' : 'PNG で保存'}
              </button>
              <select
                aria-label="保存する画像の大きさ"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              >
                <option value={1}>400×560</option>
                <option value={2}>800×1120</option>
              </select>
            </div>
            <div className="row">
              <button type="button" className="small" onClick={onExportJson}>
                JSON に書き出す
              </button>
              <button type="button" className="small" onClick={() => importRef.current?.click()}>
                JSON を読み込む
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  void onImportJson(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button type="button" className="small danger" onClick={onReset}>
                リセット
              </button>
            </div>
            {message && <p className="error">{message}</p>}
            {saveResult !== 'saved' && <p className="muted">{SAVE_MESSAGES[saveResult]}</p>}
          </div>
        </section>

        <section className="editor-pane" aria-label="入力">
          <Editor card={card} dispatch={dispatch} />
        </section>
      </main>

      <footer className="footer">
        <p>
          非公式のファンメイドツールです。株式会社ポケモン・任天堂・クリーチャーズ・ゲームフリークとは関係ありません。
        </p>
      </footer>
    </div>
  );
};
