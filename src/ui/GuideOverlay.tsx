import type { Guide } from '../layout/guides';
import { CARD_HEIGHT, CARD_WIDTH } from '../render/renderCard';

/** レイアウトの枠と線を、カード座標（400×560）の SVG でプレビューに重ねる */
export const GuideOverlay = ({ guides }: { guides: Guide[] }) => {
  let lineIndex = 0;
  return (
    <svg
      className="layout-guides"
      data-testid="layout-guides"
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      aria-hidden
    >
      {guides.map((g, i) => {
        if (g.kind === 'line') {
          // 縦線のラベルが重ならないよう、少しずつ下にずらす
          const offset = 9 + lineIndex++ * 8;
          return (
            <g key={i} className={`guide guide-${g.group}`}>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} strokeDasharray="3 2" />
              {/* カードの右寄りの線は、ラベルがはみ出さないよう線の左側に書く */}
              <text
                x={g.x1 > CARD_WIDTH * 0.75 ? g.x1 - 2 : g.x1 + 2}
                y={g.y1 + offset}
                textAnchor={g.x1 > CARD_WIDTH * 0.75 ? 'end' : 'start'}
              >
                {g.label}
              </text>
            </g>
          );
        }
        return (
          <g key={i} className={`guide guide-${g.group}`}>
            {g.shape === 'circle' ? (
              <ellipse cx={g.x + g.w / 2} cy={g.y + g.h / 2} rx={g.w / 2} ry={g.h / 2} />
            ) : (
              <rect x={g.x} y={g.y} width={g.w} height={g.h} />
            )}
            <text x={g.x + 1.5} y={g.y + 7}>
              {g.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
