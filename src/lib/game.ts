import type { Level } from '../types';

/** 영역 id -> 칠한 색 인덱스(0~3). null/undefined 는 비어 있음. */
export type Coloring = Record<string, number | null>;

/**
 * 인접한 두 영역이 같은 색으로 칠해진 "위반" 쌍들을 반환한다.
 * 색이 비어 있는 영역은 위반이 아니다.
 */
export function findViolations(level: Level, coloring: Coloring): [string, string][] {
  const bad: [string, string][] = [];
  for (const [a, b] of level.edges) {
    const ca = coloring[a];
    const cb = coloring[b];
    if (ca != null && cb != null && ca === cb) {
      bad.push([a, b]);
    }
  }
  return bad;
}

/** 위반에 연루된 영역 id 집합. */
export function violatingNodes(level: Level, coloring: Coloring): Set<string> {
  const set = new Set<string>();
  for (const [a, b] of findViolations(level, coloring)) {
    set.add(a);
    set.add(b);
  }
  return set;
}

/** 모든 영역이 칠해졌는지. */
export function allColored(level: Level, coloring: Coloring): boolean {
  return level.nodes.every((n) => coloring[n.id] != null);
}

/** 완료 조건: 모든 영역이 칠해지고 인접 위반이 0. */
export function isComplete(level: Level, coloring: Coloring): boolean {
  return allColored(level, coloring) && findViolations(level, coloring).length === 0;
}

/** 현재 사용한 서로 다른 색의 수. */
export function colorsUsed(coloring: Coloring): number {
  const used = new Set<number>();
  for (const v of Object.values(coloring)) {
    if (v != null) used.add(v);
  }
  return used.size;
}

/** 인접 리스트(id -> 이웃 id 배열)로 변환. */
export function adjacency(level: Level): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const n of level.nodes) adj.set(n.id, []);
  for (const [a, b] of level.edges) {
    adj.get(a)?.push(b);
    adj.get(b)?.push(a);
  }
  return adj;
}

/**
 * 힌트: 현재 칠한 상태를 그대로 두고, 아직 비어 있는 영역 중 하나를
 * 규칙에 맞게(이웃과 다른 색) 칠할 수 있는 색을 백트래킹으로 찾아 돌려준다.
 * 현재 상태에서 완성까지 갈 수 있는 "안전한 한 수"를 제시한다.
 *
 * 반환: { nodeId, color } 또는 null(힌트 불가).
 */
export function findHint(
  level: Level,
  coloring: Coloring,
  maxColors = 4,
): { nodeId: string; color: number } | null {
  const adj = adjacency(level);
  const order = level.nodes.map((n) => n.id);

  // 현재 coloring 을 복사해 완성 가능한 전체 해를 백트래킹으로 찾는다.
  const work: Coloring = { ...coloring };

  const emptyNodes = order.filter((id) => work[id] == null);
  // 완성 해를 구한 뒤, 비어 있던 영역 중 "선택 순서상 먼저"인 것을 힌트로 제시.
  if (emptyNodes.length === 0) return null;

  const solve = (idx: number): boolean => {
    if (idx >= emptyNodes.length) return true;
    const id = emptyNodes[idx];
    for (let c = 0; c < maxColors; c++) {
      const conflict = (adj.get(id) ?? []).some((nb) => work[nb] === c);
      if (!conflict) {
        work[id] = c;
        if (solve(idx + 1)) return true;
        work[id] = null;
      }
    }
    return false;
  };

  if (!solve(0)) return null;
  const hintId = emptyNodes[0];
  const hintColor = work[hintId];
  if (hintColor == null) return null;
  return { nodeId: hintId, color: hintColor };
}

/**
 * 이 지도를 칠하는 데 필요한 최소 색 수(색칠 수, chromatic number)를 계산.
 * 영역 수가 적은 교육용 레벨 전제로 1~4색을 순서대로 시도한다.
 */
export function chromaticNumber(level: Level): number {
  const adj = adjacency(level);
  const order = level.nodes.map((n) => n.id);

  const canColorWith = (k: number): boolean => {
    const assign: Record<string, number> = {};
    const bt = (idx: number): boolean => {
      if (idx >= order.length) return true;
      const id = order[idx];
      for (let c = 0; c < k; c++) {
        const conflict = (adj.get(id) ?? []).some((nb) => assign[nb] === c);
        if (!conflict) {
          assign[id] = c;
          if (bt(idx + 1)) return true;
          delete assign[id];
        }
      }
      return false;
    };
    return bt(0);
  };

  for (let k = 1; k <= 8; k++) {
    if (canColorWith(k)) return k;
  }
  return 8;
}
