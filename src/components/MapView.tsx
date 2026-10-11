import type { Level } from '../types';
import type { Coloring } from '../lib/game';
import { EMPTY_FILL, EMPTY_INK, type ColorChoice } from '../lib/colors';

interface Props {
  level: Level;
  coloring: Coloring;
  /** 4개 슬롯에 들어 있는 색 */
  slots: ColorChoice[];
  violating: Set<string>;
  onPaint: (nodeId: string) => void;
  /** 힌트로 깜빡일 영역 id */
  hintNode?: string | null;
}

export default function MapView({ level, coloring, slots, violating, onPaint, hintNode }: Props) {
  const { w, h } = level.viewBox;
  return (
    <svg
      className="map"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={`${level.title} 지도`}
    >
      {level.nodes.map((node) => {
        const c = coloring[node.id];
        const paint = c != null ? slots[c] : null;
        const num = c != null ? c + 1 : null;
        const fill = paint ? paint.fill : EMPTY_FILL;
        const ink = paint ? paint.ink : EMPTY_INK;
        const isBad = violating.has(node.id);
        const isHint = hintNode === node.id;
        const label = node.label;

        return (
          <g
            key={node.id}
            className={
              'region' + (isBad ? ' region--bad' : '') + (isHint ? ' region--hint' : '')
            }
            onClick={() => onPaint(node.id)}
            role="button"
            tabIndex={0}
            aria-label={
              `영역 ${label ?? node.id}` +
              (paint ? `, ${num}번 ${paint.name}` : ', 비어 있음') +
              (isBad ? ', 이웃과 같은 색 — 고쳐야 해요' : '')
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPaint(node.id);
              }
            }}
          >
            {node.shapes.map((d, i) => (
              <path key={i} d={d} fill={fill} className="region__path" />
            ))}
            {/* 색 번호(색각 이상 대응). 지역명 등 글자는 지도에 표시하지 않는다. */}
            {paint && (
              <text
                x={node.centroid.x}
                y={node.centroid.y + 6}
                className="region__num"
                fill={ink}
                textAnchor="middle"
              >
                {num}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
