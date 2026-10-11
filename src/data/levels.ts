import type { Level } from '../types';
import { buildFromRects, buildWheel, type RectRegion } from '../lib/geometry';
import { buildSlices, type Line } from '../lib/slice';
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

// ---- 레벨: 기본 — 조각보(직선으로 쪼갠 추상 지도) ----
const lPatch = (() => {
  const lines: Line[] = [
    { x1: 0, y1: 110, x2: 320, y2: 70 },
    { x1: 0, y1: 250, x2: 320, y2: 300 },
    { x1: 100, y1: 0, x2: 150, y2: 400 },
    { x1: 240, y1: 0, x2: 205, y2: 400 },
    { x1: 0, y1: 20, x2: 320, y2: 360 },
  ];
  const { nodes, edges } = buildSlices(320, 400, lines);
  return finalize({
    id: 'l6-patch',
    title: '기본 · 조각보',
    difficulty: 2,
    blurb: '직선으로 쪼갠 알록달록 조각보예요.',
    nodes,
    edges,
    viewBox: { w: 320, h: 400 },
  });
})();

// ---- 레벨: 도전 — 아홉 조각 바퀴(가운데 + 홀수 9조각, 4색 필요) ----
const lStar = (() => {
  const { nodes, edges } = buildWheel({
    cx: 180,
    cy: 180,
    r0: 62,
    radii: [162],
    counts: [9],
  });
  return finalize({
    id: 'l8-star',
    title: '도전 · 아홉 조각',
    difficulty: 3,
    blurb: '가운데를 아홉 조각이 빙 둘러쌌어요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 360 },
  });
})();

// 몬드리안풍 네모 블록 지도. 각 레이아웃에 "가운데 + 홀수 5조각 순환"(W5)
// 구조를 넣어 4색이 꼭 필요하도록 했다. 영역은 직사각형(일부는 ㄱ자 2조각).
const R = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

// ---- 레벨: 도전 — 네모 블록(몬드리안풍, 4색 필요) ----
const lBlock = (() => {
  const regions: RectRegion[] = [
    { id: 'a', rects: [R(0, 0, 200, 120)] },
    { id: 'b', rects: [R(200, 0, 160, 120)] },
    { id: 'c', rects: [R(0, 120, 120, 120)] },
    { id: 'd', rects: [R(120, 120, 120, 120)] }, // 가운데
    { id: 'e', rects: [R(240, 120, 120, 240)] },
    { id: 'f', rects: [R(0, 240, 240, 120)] },
  ];
  const { nodes, edges } = buildFromRects(regions);
  return finalize({
    id: 'l9-block',
    title: '도전 · 네모 블록',
    difficulty: 3,
    blurb: '크고 작은 네모 블록을 규칙에 맞게 칠해 보세요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 360 },
  });
})();

// ---- 레벨: 도전 — 몬드리안(ㄱ자 블록이 섞인 K4 구조, 4색 필요·가장 빡빡) ----
const lMondrian = (() => {
  // 네모 블록과 다른 모양: 위 가로바 + 가운데 + ㄱ자 블록 + 세로바로 K4 를 이룬다.
  const regions: RectRegion[] = [
    { id: 'x', rects: [R(0, 0, 360, 90)] }, // 위 가로바
    { id: 'w', rects: [R(120, 90, 120, 90)] }, // 가운데
    { id: 'y', rects: [R(0, 90, 120, 90), R(0, 180, 240, 90)] }, // ㄱ자
    { id: 'z', rects: [R(240, 90, 120, 180)] }, // 우 세로바
    { id: 'p', rects: [R(0, 270, 180, 90)] }, // 아래 왼쪽
    { id: 'q', rects: [R(180, 270, 180, 90)] }, // 아래 오른쪽
  ];
  const { nodes, edges } = buildFromRects(regions);
  return finalize({
    id: 'l10-mondrian',
    title: '도전 · 몬드리안',
    difficulty: 3,
    blurb: 'ㄱ자 블록이 섞인 몬드리안이에요. 가장 까다로워요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 360 },
  });
})();

// ---- 레벨: 도전 — 색종이 벽(네모가 많은 몬드리안, 4색 필요) ----
const lWall = (() => {
  // 좌상단에 4색 코어(W5), 우측열·하단행을 더해 조각을 늘렸다.
  const regions: RectRegion[] = [
    { id: 'a', rects: [R(0, 0, 150, 90)] },
    { id: 'b', rects: [R(150, 0, 90, 90)] },
    { id: 'c', rects: [R(0, 90, 90, 90)] },
    { id: 'd', rects: [R(90, 90, 90, 90)] }, // 가운데
    { id: 'e', rects: [R(180, 90, 90, 180)] },
    { id: 'f', rects: [R(0, 180, 180, 90)] },
    { id: 'g', rects: [R(240, 0, 120, 90)] },
    { id: 'h', rects: [R(270, 90, 90, 180)] },
    { id: 'i', rects: [R(0, 270, 150, 90)] },
    { id: 'j', rects: [R(150, 270, 210, 90)] },
  ];
  const { nodes, edges } = buildFromRects(regions);
  return finalize({
    id: 'l7-wall',
    title: '도전 · 색종이 벽',
    difficulty: 3,
    blurb: '여러 네모가 맞물린 색종이 벽이에요.',
    nodes,
    edges,
    viewBox: { w: 360, h: 360 },
  });
})();

// 레벨 순서: 입문 → 기본 → 도전. 쉬운 것부터 차근차근.
// 쉬운 것부터. 난이도는 "조각 수"가 아니라 "4색 해의 적음(제약의 빡빡함)"으로
// 정렬한다. 색종이 벽은 조각은 많아도 해가 많아 느슨하고, 네모 블록·몬드리안은
// 조각이 적어도 4색 해가 매우 적어 가장 어렵다 → 9·10번에 둔다.
export const LEVELS: Level[] = [
  l1, // 입문 · 네 조각 (2색)
  l2, // 입문 · 바람개비 (3색)
  lPatch, // 기본 · 조각보 (2색)
  l3, // 기본 · 일곱 꽃잎 (4색)
  l4, // 기본 · 두 겹 꽃 (4색)
  lStar, // 도전 · 아홉 조각 (4색)
  l5, // 도전 · 대한민국 (4색)
  lWall, // 도전 · 색종이 벽 (느슨, 해 많음)
  lBlock, // 도전 · 네모 블록 (빡빡, 가장 어려움)
  lMondrian, // 도전 · 몬드리안 (빡빡, 가장 어려움)
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
