// KOSTAT 시·도 경계 GeoJSON → 게임용 SVG 노드 데이터(src/data/koreaMap.ts) 변환.
//
// 사용: node scripts/convertKorea.mjs <geojson 경로> <출력 ts 경로>
//
// - 경위도(WGS84)를 중위도 보정 등장방형 투영으로 화면 좌표로 바꾼다.
// - 전체를 viewBox(W x H)에 맞게 스케일·이동한다.
// - 아주 작은 섬 조각은 걸러 노이즈·용량을 줄인다(각 도의 가장 큰 조각은 유지).
// - enclave(서울·인천 등)는 면적 내림차순으로 정렬해, 작은 도가 큰 도 위에
//   그려지도록 한다(표시·클릭 모두 해결).
import { readFileSync, writeFileSync } from 'node:fs';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('usage: node scripts/convertKorea.mjs <geojson> <out.ts>');
  process.exit(1);
}

const W = 360;
const PAD = 12;

// KOSTAT 시도코드 → { id, label }
const META = {
  '11': { id: 'seoul', label: '서울' },
  '21': { id: 'busan', label: '부산' },
  '22': { id: 'daegu', label: '대구' },
  '23': { id: 'incheon', label: '인천' },
  '24': { id: 'gwangju', label: '광주' },
  '25': { id: 'daejeon', label: '대전' },
  '26': { id: 'ulsan', label: '울산' },
  '29': { id: 'sejong', label: '세종' },
  '31': { id: 'gyeonggi', label: '경기' },
  '32': { id: 'gangwon', label: '강원' },
  '33': { id: 'chungbuk', label: '충북' },
  '34': { id: 'chungnam', label: '충남' },
  '35': { id: 'jeonbuk', label: '전북' },
  '36': { id: 'jeonnam', label: '전남' },
  '37': { id: 'gyeongbuk', label: '경북' },
  '38': { id: 'gyeongnam', label: '경남' },
  '39': { id: 'jeju', label: '제주' },
};

// 라벨 위치 보정(화면 좌표). 작은 지역이 밀집해 라벨이 겹치는 곳을 수동 분산.
// 값을 주지 않은 도는 자동 centroid 를 쓴다.
const LABEL_OVERRIDE = {
  gyeonggi: { x: 168, y: 56 }, // 서울을 감싸 centroid 가 서울과 겹침 → 북동부로
  incheon: { x: 106, y: 96 }, // 서해안 쪽으로
  seoul: { x: 138, y: 82 },
  chungnam: { x: 116, y: 152 },
  sejong: { x: 151, y: 138 },
  daejeon: { x: 166, y: 167 },
  gyeongnam: { x: 194, y: 244 }, // 대구·부산과 분리
  daegu: { x: 224, y: 199 },
  ulsan: { x: 270, y: 206 }, // 부산과 분리
  busan: { x: 252, y: 240 },
};

const geo = JSON.parse(readFileSync(inPath, 'utf8'));

// 중위도 보정 계수
const LAT0 = 36;
const K = Math.cos((LAT0 * Math.PI) / 180);
const projX = (lon) => lon * K;
const projY = (lat) => -lat;

// 1) 전체 bbox 계산
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const f of geo.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      for (const [lon, lat] of ring) {
        const x = projX(lon), y = projY(lat);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
}
const spanX = maxX - minX;
const spanY = maxY - minY;
const scale = (W - 2 * PAD) / spanX;
const H = Math.round(spanY * scale + 2 * PAD);
const tx = (x) => (x - minX) * scale + PAD;
const ty = (y) => (y - minY) * scale + PAD;

const round = (n) => Math.round(n * 10) / 10;

function ringToPath(ring) {
  let d = '';
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const x = round(tx(projX(lon)));
    const y = round(ty(projY(lat)));
    d += (i === 0 ? 'M' : 'L') + x + ',' + y;
  }
  return d + 'Z';
}

// shoelace 면적(절댓값), 화면 좌표 기준
function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[(i + 1) % ring.length];
    const x1 = tx(projX(lon1)), y1 = ty(projY(lat1));
    const x2 = tx(projX(lon2)), y2 = ty(projY(lat2));
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function ringCentroid(ring) {
  let sx = 0, sy = 0;
  for (const [lon, lat] of ring) {
    sx += tx(projX(lon));
    sy += ty(projY(lat));
  }
  return { x: round(sx / ring.length), y: round(sy / ring.length) };
}

// 작은 섬 필터: 전체 지도 면적의 이 비율보다 작은 조각은 버림
const MIN_AREA = (W * H) * 0.0006;

const nodes = [];
for (const f of geo.features) {
  const code = String(f.properties.code);
  const meta = META[code];
  if (!meta) {
    console.warn('unknown code', code, f.properties.name);
    continue;
  }
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;

  // 각 폴리곤의 외곽 ring만 사용(구멍 없음을 확인함)
  const pieces = polys
    .map((poly) => ({ ring: poly[0], area: ringArea(poly[0]) }))
    .sort((a, b) => b.area - a.area);

  const biggest = pieces[0];
  const kept = pieces.filter((p, i) => i === 0 || p.area >= MIN_AREA);

  const centroid = LABEL_OVERRIDE[meta.id] ?? ringCentroid(biggest.ring);
  nodes.push({
    id: meta.id,
    label: meta.label,
    area: biggest.area,
    shapes: kept.map((p) => ringToPath(p.ring)),
    centroid,
  });
}

// 면적 내림차순 → 작은 도(enclave)가 나중에(위에) 그려짐
nodes.sort((a, b) => b.area - a.area);

const out =
  `// 자동 생성 파일 — scripts/convertKorea.mjs 가 KOSTAT 시·도 경계에서 생성.\n` +
  `// 출처: southkorea/southkorea-maps (KOSTAT, "Free to share or remix").\n` +
  `// 직접 수정하지 말 것. 재생성: node scripts/convertKorea.mjs <geojson> src/data/koreaMap.ts\n` +
  `import type { MapNode } from '../types';\n\n` +
  `export const KOREA_VIEWBOX = { w: ${W}, h: ${H} };\n\n` +
  `export const KOREA_NODES: MapNode[] = ${JSON.stringify(
    nodes.map(({ id, label, shapes, centroid }) => ({ id, label, shapes, centroid })),
    null,
    0,
  )};\n`;

writeFileSync(outPath, out);

const totalPts = nodes.reduce((s, n) => s + n.shapes.join('').length, 0);
console.log(`viewBox ${W}x${H}, nodes ${nodes.length}, out ${(out.length / 1024).toFixed(1)}KB`);
console.log('order:', nodes.map((n) => n.label).join(' > '));
console.log('shape counts:', nodes.map((n) => `${n.label}:${n.shapes.length}`).join(' '));
