import type { MapNode } from '../types';

// ---- 사각형 타일 기반 지도 ----
//
// 많은 레벨은 "타일(사각형)"을 배치해 만든다. 한 영역(노드)은 여러 개의
// 사각형으로 이루어질 수 있어(멀티 폴리곤) ㄱ자 모양·둘러싸기 등을 표현한다.
// 인접 관계는 두 영역의 사각형이 "변"을 일정 길이 이상 맞대면 자동으로
// 계산한다(꼭짓점만 닿는 경우는 제외 — 4색 정리의 전제와 동일).

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RectRegion {
  id: string;
  label?: string;
  rects: Rect[];
}

const EPS = 0.5; // 맞댄 변의 최소 길이(점 접촉 제외)

function rectPath(r: Rect): string {
  return `M${r.x},${r.y} H${r.x + r.w} V${r.y + r.h} H${r.x} Z`;
}

/** 두 사각형이 변을 (길이>EPS 로) 맞대고 있는지. */
function rectsAdjacent(a: Rect, b: Rect): boolean {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;

  // 수직 변 접촉(좌우로 맞닿음): x 가 일치하고 y 구간이 겹침
  const touchVertical =
    (Math.abs(ax2 - b.x) < EPS || Math.abs(bx2 - a.x) < EPS) &&
    Math.min(ay2, by2) - Math.max(a.y, b.y) > EPS;

  // 수평 변 접촉(위아래로 맞닿음): y 가 일치하고 x 구간이 겹침
  const touchHorizontal =
    (Math.abs(ay2 - b.y) < EPS || Math.abs(by2 - a.y) < EPS) &&
    Math.min(ax2, bx2) - Math.max(a.x, b.x) > EPS;

  return touchVertical || touchHorizontal;
}

function regionsAdjacent(a: RectRegion, b: RectRegion): boolean {
  for (const ra of a.rects) {
    for (const rb of b.rects) {
      if (rectsAdjacent(ra, rb)) return true;
    }
  }
  return false;
}

function centroidOf(rects: Rect[]): { x: number; y: number } {
  // 면적이 가장 큰 사각형의 중심을 라벨 위치로 사용(멀티 폴리곤에서 자연스러움).
  let best = rects[0];
  let bestArea = best.w * best.h;
  for (const r of rects) {
    const area = r.w * r.h;
    if (area > bestArea) {
      best = r;
      bestArea = area;
    }
  }
  return { x: best.x + best.w / 2, y: best.y + best.h / 2 };
}

/** 사각형 영역 목록으로부터 노드 + (자동 계산된) 인접 간선을 만든다. */
export function buildFromRects(regions: RectRegion[]): {
  nodes: MapNode[];
  edges: [string, string][];
} {
  const nodes: MapNode[] = regions.map((r) => ({
    id: r.id,
    label: r.label,
    shapes: r.rects.map(rectPath),
    centroid: centroidOf(r.rects),
  }));

  const edges: [string, string][] = [];
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      if (regionsAdjacent(regions[i], regions[j])) {
        edges.push([regions[i].id, regions[j].id]);
      }
    }
  }
  return { nodes, edges };
}

// ---- 방사형(바퀴/꽃) 지도 ----
//
// 중심 원 + 바깥 고리(부채꼴)로 이루어진 지도. 홀수 고리는 4색이 필요해
// "기본" 난이도에 적합하다.

function polar(cx: number, cy: number, r: number, angDeg: number) {
  const a = (angDeg - 90) * (Math.PI / 180); // 12시 방향을 0도로
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** 부채꼴(환형 섹터) path. rInner=0 이면 파이 조각. */
function sectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number,
): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const po0 = polar(cx, cy, rOuter, a0);
  const po1 = polar(cx, cy, rOuter, a1);
  if (rInner <= 0.01) {
    return `M${cx},${cy} L${po0.x},${po0.y} A${rOuter},${rOuter} 0 ${large} 1 ${po1.x},${po1.y} Z`;
  }
  const pi0 = polar(cx, cy, rInner, a0);
  const pi1 = polar(cx, cy, rInner, a1);
  return [
    `M${pi0.x},${pi0.y}`,
    `L${po0.x},${po0.y}`,
    `A${rOuter},${rOuter} 0 ${large} 1 ${po1.x},${po1.y}`,
    `L${pi1.x},${pi1.y}`,
    `A${rInner},${rInner} 0 ${large} 0 ${pi0.x},${pi0.y}`,
    'Z',
  ].join(' ');
}

export interface WheelSpec {
  cx: number;
  cy: number;
  /** 중심 원 반지름 */
  r0: number;
  /** 각 고리의 바깥 반지름 (바깥쪽으로 순서대로) */
  radii: number[];
  /** 각 고리의 조각 수 */
  counts: number[];
  /** 각 고리의 각도 오프셋(기본 0). 바깥 고리를 반 칸 돌려 엇갈리게 할 때 사용 */
  offsets?: number[];
}

/**
 * 바퀴/꽃 지도를 만든다.
 * 노드 id: 중심은 "c", 고리 조각은 "r{ring}s{slot}".
 * 인접: 중심-1고리, 고리 내 원형 이웃, 고리 간 각도 겹침.
 */
export function buildWheel(spec: WheelSpec): {
  nodes: MapNode[];
  edges: [string, string][];
} {
  const { cx, cy, r0, radii, counts } = spec;
  const offsets = spec.offsets ?? radii.map(() => 0);
  const nodes: MapNode[] = [];
  const edges: [string, string][] = [];

  // 중심
  nodes.push({
    id: 'c',
    shapes: [`M${cx + r0},${cy} A${r0},${r0} 0 1 1 ${cx - r0},${cy} A${r0},${r0} 0 1 1 ${cx + r0},${cy} Z`],
    centroid: { x: cx, y: cy },
  });

  // 각 고리 조각의 각도 구간 저장(고리 간 인접 계산용)
  const ringSlots: { id: string; a0: number; a1: number; ring: number }[] = [];

  for (let ring = 0; ring < counts.length; ring++) {
    const n = counts[ring];
    const rIn = ring === 0 ? r0 : radii[ring - 1];
    const rOut = radii[ring];
    const off = offsets[ring];
    for (let s = 0; s < n; s++) {
      const a0 = off + (360 / n) * s;
      const a1 = off + (360 / n) * (s + 1);
      const id = `r${ring}s${s}`;
      const mid = (a0 + a1) / 2;
      const rMid = (rIn + rOut) / 2;
      const cPt = polar(cx, cy, rMid, mid);
      nodes.push({
        id,
        shapes: [sectorPath(cx, cy, rIn, rOut, a0, a1)],
        centroid: { x: cPt.x, y: cPt.y },
      });
      ringSlots.push({ id, a0, a1, ring });

      // 고리 내부 원형 이웃
      if (n > 1) {
        const nextId = `r${ring}s${(s + 1) % n}`;
        edges.push([id, nextId]);
      }
    }
    // 중심-1고리
    if (ring === 0) {
      for (let s = 0; s < n; s++) edges.push(['c', `r0s${s}`]);
    }
  }

  // 고리 간 인접: 각도 구간이 겹치면 인접
  const norm = (a: number) => ((a % 360) + 360) % 360;
  const overlap = (x0: number, x1: number, y0: number, y1: number): boolean => {
    // 두 각도 구간 [x0,x1], [y0,y1] 가 길이>0 로 겹치는지(원형 고려)
    const len = (a0: number, a1: number) => a1 - a0;
    // 각 구간을 0~360 기준으로 자잘하게 쪼개 비교(교육용 작은 지도라 단순 비교로 충분)
    const samples = 48;
    const inRange = (a: number, s0: number, s1: number) => {
      const na = norm(a);
      const ns0 = norm(s0);
      const ns1 = ns0 + len(s0, s1);
      return (na >= ns0 && na <= ns1) || (na + 360 >= ns0 && na + 360 <= ns1);
    };
    for (let i = 0; i < samples; i++) {
      const a = x0 + ((x1 - x0) * (i + 0.5)) / samples;
      if (inRange(a, y0, y1)) return true;
    }
    return false;
  };

  for (let i = 0; i < ringSlots.length; i++) {
    for (let j = i + 1; j < ringSlots.length; j++) {
      const A = ringSlots[i];
      const B = ringSlots[j];
      if (B.ring === A.ring + 1 && overlap(A.a0, A.a1, B.a0, B.a1)) {
        edges.push([A.id, B.id]);
      }
    }
  }

  return { nodes, edges };
}
