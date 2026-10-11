// 레벨 데이터 검증 스크립트.
//   npm run validate:levels
//
// 각 레벨에 대해:
//   - 영역 수, 간선 수
//   - 실제 최소 색 수(chromaticNumber)와 선언된 minColors 일치 여부
//   - 4색으로 반드시 칠할 수 있는지(교육용 전제) 확인
//   - 고립 영역, 자기 간선 등 이상 데이터 경고
import { LEVELS } from '../src/data/levels';
import { adjacency, chromaticNumber } from '../src/lib/game';

let failed = false;

for (const lv of LEVELS) {
  const chi = chromaticNumber(lv);
  const adj = adjacency(lv);
  const isolated = lv.nodes.filter((n) => (adj.get(n.id) ?? []).length === 0).map((n) => n.id);
  const selfLoops = lv.edges.filter(([a, b]) => a === b);

  const ok4 = chi <= 4;
  const matchMin = chi === lv.minColors;

  console.log(`\n■ ${lv.id} — ${lv.title}`);
  console.log(`   영역 ${lv.nodes.length}개 · 간선 ${lv.edges.length}개`);
  console.log(`   필요한 최소 색: ${chi}색 (선언: ${lv.minColors}색) ${matchMin ? '✓' : '✗ 불일치'}`);
  console.log(`   4색으로 칠하기: ${ok4 ? '가능 ✓' : '불가능 ✗'}`);
  if (isolated.length) console.log(`   고립 영역(이웃 없음): ${isolated.join(', ')}`);
  if (selfLoops.length) console.log(`   ⚠ 자기 간선 발견: ${JSON.stringify(selfLoops)}`);

  if (!ok4 || !matchMin || selfLoops.length) failed = true;
}

console.log('\n' + (failed ? '✗ 검증 실패: 위 항목을 확인하세요.' : '✓ 모든 레벨 검증 통과.'));
process.exit(failed ? 1 : 0);
