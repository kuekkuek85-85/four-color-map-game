import type { MapNode } from '../types';

// 직선으로 면을 쪼개 만든 "조각보 / 스테인드글라스" 지도.
//
// 사각 캔버스를 여러 직선으로 잘라 볼록(convex) 조각들로 나눈다. 각 조각이
// 하나의 영역(노드)이 되고, 두 조각이 변을 맞대면 인접으로 본다(공유 변 검출).
// 직선으로 자른 평면 분할이라 모든 인접이 실제 경계와 정확히 일치한다.

interface Pt {
  x: number;
  y: number;
}
type Poly = Pt[];

/** 두 점을 지나는 직선. eval(p) = n·p - c 의 부호로 반평면을 가른다. */
export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const EPS = 1e-6;

function lineEval(L: { nx: number; ny: number; c: number }, p: Pt): number {
  return L.nx * p.x + L.ny * p.y - L.c;
}

function toNormal(l: Line) {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  const nx = -dy;
  const ny = dx;
  const c = nx * l.x1 + ny * l.y1;
  return { nx, ny, c };
}

function polyArea(poly: Poly): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

function intersect(prev: Pt, cur: Pt, L: { nx: number; ny: number; c: number }): Pt {
  const dp = lineEval(L, prev);
  const dc = lineEval(L, cur);
  const t = dp / (dp - dc);
  return { x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) };
}

/** 반평면으로 폴리곤을 자른다(keepPositive: n·p-c >= 0 쪽을 남김). */
function clipHalf(poly: Poly, L: { nx: number; ny: number; c: number }, keepPositive: boolean): Poly | null {
  const out: Poly = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i - 1 + poly.length) % poly.length];
    const dc = lineEval(L, cur);
    const dp = lineEval(L, prev);
    const curIn = keepPositive ? dc >= -EPS : dc <= EPS;
    const prevIn = keepPositive ? dp >= -EPS : dp <= EPS;
    if (curIn) {
      if (!prevIn) out.push(intersect(prev, cur, L));
      out.push(cur);
    } else if (prevIn) {
      out.push(intersect(prev, cur, L));
    }
  }
  return out.length >= 3 ? out : null;
}

function splitPoly(poly: Poly, l: Line): Poly[] {
  const L = toNormal(l);
  const res: Poly[] = [];
  const a = clipHalf(poly, L, true);
  const b = clipHalf(poly, L, false);
  if (a && polyArea(a) > 1) res.push(a);
  if (b && polyArea(b) > 1) res.push(b);
  return res.length ? res : [poly];
}

function cross(ox: number, oy: number, ax: number, ay: number, bx: number, by: number): number {
  return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
}

/** 두 변이 같은 직선 위에서 길이>0 로 겹치는지(= 인접). */
function edgesShared(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < EPS) return false;
  // c,d 가 a-b 직선 위에 있어야(공선)
  const tol = 0.05 * Math.sqrt(len2);
  if (Math.abs(cross(a.x, a.y, b.x, b.y, c.x, c.y)) > tol) return false;
  if (Math.abs(cross(a.x, a.y, b.x, b.y, d.x, d.y)) > tol) return false;
  const tc = ((c.x - a.x) * vx + (c.y - a.y) * vy) / len2;
  const td = ((d.x - a.x) * vx + (d.y - a.y) * vy) / len2;
  const lo = Math.max(0, Math.min(tc, td));
  const hi = Math.min(1, Math.max(tc, td));
  return (hi - lo) * Math.sqrt(len2) > 0.5;
}

function polysAdjacent(p1: Poly, p2: Poly): boolean {
  for (let i = 0; i < p1.length; i++) {
    const a = p1[i];
    const b = p1[(i + 1) % p1.length];
    for (let j = 0; j < p2.length; j++) {
      const c = p2[j];
      const d = p2[(j + 1) % p2.length];
      if (edgesShared(a, b, c, d)) return true;
    }
  }
  return false;
}

function polyPath(poly: Poly): string {
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = '';
  for (let i = 0; i < poly.length; i++) {
    d += (i === 0 ? 'M' : 'L') + r(poly[i].x) + ',' + r(poly[i].y);
  }
  return d + 'Z';
}

function centroid(poly: Poly): { x: number; y: number } {
  let sx = 0, sy = 0;
  for (const p of poly) {
    sx += p.x;
    sy += p.y;
  }
  const r = (n: number) => Math.round(n * 10) / 10;
  return { x: r(sx / poly.length), y: r(sy / poly.length) };
}

/**
 * 사각 캔버스(w x h)를 직선들로 잘라 조각보 지도를 만든다.
 * 노드 id 는 "s0","s1",... (면적 내림차순).
 */
export function buildSlices(
  w: number,
  h: number,
  lines: Line[],
): { nodes: MapNode[]; edges: [string, string][] } {
  let cells: Poly[] = [
    [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
  ];
  for (const l of lines) {
    const next: Poly[] = [];
    for (const c of cells) next.push(...splitPoly(c, l));
    cells = next;
  }

  cells.sort((a, b) => polyArea(b) - polyArea(a));

  const nodes: MapNode[] = cells.map((poly, i) => ({
    id: 's' + i,
    shapes: [polyPath(poly)],
    centroid: centroid(poly),
  }));

  const edges: [string, string][] = [];
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (polysAdjacent(cells[i], cells[j])) edges.push(['s' + i, 's' + j]);
    }
  }
  return { nodes, edges };
}
