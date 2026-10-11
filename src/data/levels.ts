import type { Level } from '../types';
import { buildFromRects, buildWheel, type RectRegion } from '../lib/geometry';
import { chromaticNumber } from '../lib/game';
import { KOREA_NODES, KOREA_VIEWBOX } from './koreaMap';

// 레벨(지도) 정의.
// 인접 간선은 도형 데이터에서 자동으로 계산하고(geometry),
// 필요한 최소 색 수(minColors)는 그래프에서 계산한다(chromaticNumber).
// 이렇게 하면 "보이는 지도"와 "인접 데이터"가 항상 일치한다.

function finalize(
  base: Omit<Level, 'minColors'> & { minColors?: number },
): Level {
  const minColors = base.minColors ?? chromaticNumber(base as Level);
  return { ...base, minColors };
}

// ---- 레벨 1: 입문 — 네 조각 ----
const l1 = (() => {
  const regions: RectRegion[] = [
    { id: 'a', rects: [{ x: 0, y: 0, w: 180, h: 180 }] },
    { id: 'b', rects: [{ x: 180, y: 0, w: 180, h: 180 }] },
    { id: 'c', rects: [{ x: 0, y: 180, w: 180, h: 180 }] },
    { id: 'd', rects: [{ x: 180, y: 180, w: 180, h: 180 }] },
  ];
  const { nodes, edges } = buildFromRects(regions);
  return finalize({
    id: 'l1-intro-4',
    title: '입문 · 네 조각',
    difficulty: 1,
    blurb: '네 조각으로 이루어진 가장 단순한 지도예요. 가볍게 시작해 보세요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 360 },
  });
})();

// ---- 레벨 2: 입문 — 바람개비(가운데 + 네 조각) ----
const l2 = (() => {
  const { nodes, edges } = buildWheel({
    cx: 180,
    cy: 180,
    r0: 62,
    radii: [155],
    counts: [4],
  });
  return finalize({
    id: 'l2-wheel-5',
    title: '입문 · 바람개비',
    difficulty: 1,
    blurb: '가운데를 바깥 조각들이 빙 둘러싼 지도예요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 360 },
  });
})();

// ---- 레벨 3: 기본 — 일곱 꽃잎(4색 필요) ----
const l3 = (() => {
  const { nodes, edges } = buildWheel({
    cx: 180,
    cy: 180,
    r0: 58,
    radii: [158],
    counts: [7],
  });
  return finalize({
    id: 'l3-wheel-8',
    title: '기본 · 일곱 꽃잎',
    difficulty: 2,
    blurb: '가운데를 둘러싼 일곱 조각. 차근차근 색을 맞춰 보세요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 360 },
  });
})();

// ---- 레벨 4: 기본 — 두 겹 꽃(4색 필요, 11조각) ----
const l4 = (() => {
  const { nodes, edges } = buildWheel({
    cx: 190,
    cy: 190,
    r0: 52,
    radii: [118, 182],
    counts: [5, 5],
    offsets: [0, 36],
  });
  return finalize({
    id: 'l4-flower-11',
    title: '기본 · 두 겹 꽃',
    difficulty: 2,
    blurb: '안쪽과 바깥쪽 꽃잎이 엇갈려요. 되돌리기를 잘 쓰면 쉬워요.',
    nodes,
    edges,
    viewBox: { w: 380, h: 380 },
  });
})();

// ---- 레벨 5: 도전 — 대한민국(실제 시·도 지도) ----
// 지도 모양은 KOSTAT 시·도 경계에서 생성(src/data/koreaMap.ts).
// 인접 관계는 실제 육지 경계를 맞댄 시·도끼리 정의한다(제주는 섬이라 이웃 없음).
const l5 = (() => {
  const edges: [string, string][] = [
    ['seoul', 'gyeonggi'],
    ['seoul', 'incheon'],
    ['incheon', 'gyeonggi'],
    ['gyeonggi', 'gangwon'],
    ['gyeonggi', 'chungbuk'],
    ['gyeonggi', 'chungnam'],
    ['gangwon', 'chungbuk'],
    ['gangwon', 'gyeongbuk'],
    ['chungbuk', 'chungnam'],
    ['chungbuk', 'sejong'],
    ['chungbuk', 'daejeon'],
    ['chungbuk', 'gyeongbuk'],
    ['chungbuk', 'jeonbuk'],
    ['chungnam', 'sejong'],
    ['chungnam', 'daejeon'],
    ['chungnam', 'jeonbuk'],
    ['sejong', 'daejeon'],
    ['gyeongbuk', 'jeonbuk'],
    ['gyeongbuk', 'gyeongnam'],
    ['gyeongbuk', 'daegu'],
    ['gyeongbuk', 'ulsan'],
    ['daegu', 'gyeongnam'],
    ['ulsan', 'gyeongnam'],
    ['ulsan', 'busan'],
    ['busan', 'gyeongnam'],
    ['gyeongnam', 'jeonbuk'],
    ['gyeongnam', 'jeonnam'],
    ['jeonbuk', 'jeonnam'],
    ['jeonnam', 'gwangju'],
  ];
  return finalize({
    id: 'l5-korea',
    title: '도전 · 대한민국',
    difficulty: 3,
    blurb: '실제 우리나라 시·도 지도예요. 제주는 섬이라 이웃이 없어요.',
    nodes: KOREA_NODES,
    edges,
    viewBox: KOREA_VIEWBOX,
  });
})();

export const LEVELS: Level[] = [l1, l2, l3, l4, l5];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
