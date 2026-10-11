import type { Level } from '../types';
import { buildFromRects, buildWheel, type RectRegion } from '../lib/geometry';
import { chromaticNumber } from '../lib/game';

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
    blurb: '가장 단순한 지도. 두 가지 색이면 충분해요.',
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
    blurb: '가운데와 바깥 조각들. 세 가지 색으로 칠할 수 있어요.',
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
    blurb: '홀수 고리는 네 가지 색이 모두 필요해요.',
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

// ---- 레벨 5: 도전 — 대한민국(단순화한 타일 지도) ----
const l5 = (() => {
  const C = 70; // 타일 한 칸
  const cell = (col: number, row: number) => ({ x: col * C, y: row * C, w: C, h: C });

  const regions: RectRegion[] = [
    { id: 'gyeonggi', label: '경기', rects: [cell(1, 0), cell(2, 0), cell(2, 1)] },
    { id: 'seoul', label: '서울', rects: [cell(1, 1)] },
    { id: 'incheon', label: '인천', rects: [cell(0, 1)] },
    { id: 'gangwon', label: '강원', rects: [cell(3, 0), cell(4, 0), cell(4, 1)] },
    { id: 'chungbuk', label: '충북', rects: [cell(3, 1), cell(3, 2)] },
    { id: 'chungnam', label: '충남', rects: [cell(0, 2), cell(1, 2)] },
    { id: 'sejong', label: '세종', rects: [cell(2, 2)] },
    { id: 'daejeon', label: '대전', rects: [cell(2, 3)] },
    { id: 'gyeongbuk', label: '경북', rects: [cell(4, 2), cell(4, 3)] },
    { id: 'daegu', label: '대구', rects: [cell(3, 3)] },
    { id: 'jeonbuk', label: '전북', rects: [cell(0, 3), cell(1, 3)] },
    { id: 'jeonnam', label: '전남', rects: [cell(0, 4), cell(1, 4), cell(1, 5)] },
    { id: 'gwangju', label: '광주', rects: [cell(0, 5)] },
    { id: 'gyeongnam', label: '경남', rects: [cell(2, 4), cell(3, 4), cell(2, 5)] },
    { id: 'ulsan', label: '울산', rects: [cell(4, 4)] },
    { id: 'busan', label: '부산', rects: [cell(3, 5), cell(4, 5)] },
    // 제주: 섬이라 육지와 인접하지 않음(바다로 떨어뜨려 배치)
    { id: 'jeju', label: '제주', rects: [{ x: 70, y: 430, w: 120, h: 55 }] },
  ];

  const { nodes, edges } = buildFromRects(regions);
  return finalize({
    id: 'l5-korea',
    title: '도전 · 대한민국',
    difficulty: 3,
    blurb: '단순화한 우리나라 시·도 지도. 제주는 섬이라 이웃이 없어요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 500 },
  });
})();

export const LEVELS: Level[] = [l1, l2, l3, l4, l5];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
