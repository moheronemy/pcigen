import { useEffect, useRef, useState, type Dispatch } from 'react';
import cardBackUrl from '../assets/card/pcardback.jpg';
import { getLayout } from '../layout/layout';
import type { CardData } from '../model/card';
import { drawCard, prepareCard } from '../render/draw';
import { CARD_HEIGHT, CARD_WIDTH } from '../render/renderCard';
import type { CardAction } from '../state/cardReducer';

interface Props {
  card: CardData;
  dispatch: Dispatch<CardAction>;
}

export const Preview = ({ card, dispatch }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  // 最新の card をイベントハンドラから参照する
  const cardRef = useRef(card);
  useEffect(() => {
    cardRef.current = card;
  }, [card]);

  useEffect(() => {
    let cancelled = false;
    prepareCard(card)
      .then((images) => {
        if (cancelled || !canvasRef.current) return;
        // 画面では高解像度ディスプレイ向けに2倍で描く
        drawCard(canvasRef.current, card, images, 2);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [card]);

  /** 画面上の座標をカード座標（400×560）に変換する */
  const toCard = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, k: 1 };
    const k = CARD_WIDTH / rect.width;
    return { x: (clientX - rect.left) * k, y: (clientY - rect.top) * k, k };
  };

  const inArtWindow = (clientX: number, clientY: number) => {
    const c = cardRef.current;
    if (!c.art.src) return false;
    const { x, y } = toCard(clientX, clientY);
    const w = getLayout(c).artWindow;
    return x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h;
  };

  // ホイールでの拡大縮小（スクロールを止めるため passive: false で登録する）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (!inArtWindow(e.clientX, e.clientY)) return;
      e.preventDefault();
      dispatch({ type: 'zoomArt', key: 'art', factor: Math.exp(-e.deltaY * 0.001) });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <div className="preview">
      <div
        className={`card-flip${flipped ? ' flipped' : ''}`}
        data-testid="card-flip"
        onDoubleClick={() => setFlipped((f) => !f)}
      >
        <canvas
          ref={canvasRef}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          className={card.art.src ? 'draggable' : undefined}
          role="img"
          aria-label={`カードのプレビュー${card.name ? `：${card.name}` : ''}`}
          data-testid="card-canvas"
          onPointerDown={(e) => {
            if (!inArtWindow(e.clientX, e.clientY)) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            const { k } = toCard(e.clientX, e.clientY);
            dispatch({
              type: 'moveArt',
              key: 'art',
              dx: (e.clientX - d.x) * k,
              dy: (e.clientY - d.y) * k,
            });
            drag.current = { ...d, x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        />
        <img
          className="card-back"
          src={cardBackUrl}
          alt="カードの裏面"
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          draggable={false}
          aria-hidden={!flipped}
        />
      </div>
      <button
        type="button"
        className="small flip-button"
        aria-pressed={flipped}
        onClick={() => setFlipped((f) => !f)}
      >
        {flipped ? 'おもてを見る' : 'うらを見る'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
