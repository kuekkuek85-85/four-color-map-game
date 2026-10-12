import type { PlayRecord } from '../types';
import { LEVELS } from '../data/levels';

const VALID_LEVELS = new Set(LEVELS.map((l) => l.id));

export interface RankRow {
  rank: number;
  studentId: string;
  name: string;
  /** 클리어한(서로 다른) 레벨 수 */
  cleared: number;
  /** 클리어한 레벨들의 최고 기록(최소 시간) 합(초) */
  totalSec: number;
  /** 총 완료 판 수 */
  plays: number;
}

/**
 * 전체 완료 기록으로 순위표를 만든다.
 * 정렬 기준: 클리어한 레벨 수(많을수록 상위) → 총 소요시간(짧을수록 상위)
 *            → 학번(안정적 정렬용).
 * 같은 (클리어 수, 총 시간)이면 같은 등수(공동 순위)를 준다.
 */
export function buildLeaderboard(plays: PlayRecord[]): RankRow[] {
  interface Agg {
    studentId: string;
    name: string;
    best: Map<string, number>; // levelId -> 최소 시간
    plays: number;
  }
  const byStudent = new Map<string, Agg>();
  for (const p of plays) {
    if (!p.studentId) continue;
    // 현재 존재하는 레벨만 집계(삭제된 과거 레벨 기록 제외)
    if (!VALID_LEVELS.has(p.levelId)) continue;
    let a = byStudent.get(p.studentId);
    if (!a) {
      a = { studentId: p.studentId, name: p.name, best: new Map(), plays: 0 };
      byStudent.set(p.studentId, a);
    }
    a.name = p.name || a.name;
    a.plays += 1;
    const prev = a.best.get(p.levelId);
    if (prev == null || p.durationSec < prev) a.best.set(p.levelId, p.durationSec);
  }

  const rows = Array.from(byStudent.values()).map((a) => {
    let totalSec = 0;
    for (const s of a.best.values()) totalSec += s;
    return {
      studentId: a.studentId,
      name: a.name,
      cleared: a.best.size,
      totalSec,
      plays: a.plays,
    };
  });

  rows.sort((x, y) => {
    if (y.cleared !== x.cleared) return y.cleared - x.cleared;
    if (x.totalSec !== y.totalSec) return x.totalSec - y.totalSec;
    return x.studentId.localeCompare(y.studentId);
  });

  const ranked: RankRow[] = [];
  let lastKey = '';
  let lastRank = 0;
  rows.forEach((r, i) => {
    const key = `${r.cleared}|${r.totalSec}`;
    const rank = key === lastKey ? lastRank : i + 1;
    lastKey = key;
    lastRank = rank;
    ranked.push({ rank, ...r });
  });
  return ranked;
}
