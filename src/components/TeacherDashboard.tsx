import { useEffect, useMemo, useState } from 'react';
import type { PlayRecord } from '../types';
import { LEVELS } from '../data/levels';
import { fetchAllPlays, storageMode } from '../repo/records';

interface Props {
  onBack: () => void;
  onLeaderboard: () => void;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default function TeacherDashboard({ onBack, onLeaderboard }: Props) {
  const [plays, setPlays] = useState<PlayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    fetchAllPlays()
      .then(setPlays)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // 참여 학생(학번 -> 이름)
  const students = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of plays) if (p.studentId) map.set(p.studentId, p.name);
    return map;
  }, [plays]);

  const totalStudents = students.size;

  const filtered = useMemo(() => {
    return plays.filter((p) => {
      if (levelFilter !== 'all' && p.levelId !== levelFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!p.studentId.includes(q) && !p.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [plays, levelFilter, search]);

  // 레벨별 집계
  const perLevel = LEVELS.map((lv) => {
    const rows = plays.filter((p) => p.levelId === lv.id);
    const uniqueStudents = new Set(rows.map((r) => r.studentId));
    const rate = totalStudents ? Math.round((uniqueStudents.size / totalStudents) * 100) : 0;
    return {
      lv,
      clears: rows.length,
      students: uniqueStudents.size,
      rate,
      avgTime: avg(rows.map((r) => r.durationSec)),
      avgColors: rows.length
        ? (rows.reduce((a, b) => a + b.colorsUsed, 0) / rows.length).toFixed(1)
        : '-',
    };
  });

  // 학생별(학번순)
  const perStudent = useMemo(() => {
    const ids = Array.from(students.keys()).sort();
    return ids
      .filter((id) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return id.includes(q) || (students.get(id) ?? '').toLowerCase().includes(q);
      })
      .map((id) => {
        const rows = plays.filter((p) => p.studentId === id);
        const clearedLevels = new Set(rows.map((r) => r.levelId)).size;
        return {
          id,
          name: students.get(id) ?? '',
          clearedLevels,
          plays: rows.length,
          lastSeen: Math.max(...rows.map((r) => r.completedAt)),
        };
      });
  }, [students, plays, search]);

  return (
    <div className="screen">
      <header className="pagehead">
        <div>
          <h1 className="pagehead__title">👩‍🏫 교사 현황판</h1>
          <p className="pagehead__sub">
            {storageMode === 'firestore'
              ? '반 전체 기록을 Firestore에서 집계합니다.'
              : '오프라인 모드: 이 기기에 저장된 기록만 보여줍니다.'}
          </p>
        </div>
        <div className="pagehead__actions">
          <button type="button" className="btn btn--ghost" onClick={onLeaderboard}>
            🏆 순위표
          </button>
          <button type="button" className="btn btn--ghost" onClick={load}>
            ⟳ 새로고침
          </button>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            ← 처음으로
          </button>
        </div>
      </header>

      {loading ? (
        <p className="muted">불러오는 중…</p>
      ) : (
        <>
          <div className="kpis">
            <div className="kpi">
              <span className="kpi__num">{totalStudents}</span>
              <span className="kpi__label">참여 학생</span>
            </div>
            <div className="kpi">
              <span className="kpi__num">{plays.length}</span>
              <span className="kpi__label">완료 판 수</span>
            </div>
            <div className="kpi">
              <span className="kpi__num">{LEVELS.length}</span>
              <span className="kpi__label">레벨 수</span>
            </div>
          </div>

          <section className="section">
            <h2 className="section__title">레벨별 현황</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>레벨</th>
                    <th>완료 학생</th>
                    <th>완료율</th>
                    <th>평균 시간</th>
                    <th>평균 색 수</th>
                  </tr>
                </thead>
                <tbody>
                  {perLevel.map((r) => (
                    <tr key={r.lv.id}>
                      <td>{r.lv.title}</td>
                      <td>
                        {r.students}명 ({r.clears}판)
                      </td>
                      <td>
                        <div className="bar">
                          <div className="bar__fill" style={{ width: `${r.rate}%` }} />
                          <span className="bar__text">{r.rate}%</span>
                        </div>
                      </td>
                      <td>{r.clears ? fmtTime(r.avgTime) : '-'}</td>
                      <td>{r.avgColors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">학생별 현황 (학번순)</h2>
              <div className="filters">
                <select
                  className="field__input field__input--sm"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  aria-label="레벨 필터"
                >
                  <option value="all">모든 레벨</option>
                  {LEVELS.map((lv) => (
                    <option key={lv.id} value={lv.id}>
                      {lv.title}
                    </option>
                  ))}
                </select>
                <input
                  className="field__input field__input--sm"
                  placeholder="학번·이름 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>학번</th>
                    <th>이름</th>
                    <th>클리어 레벨</th>
                    <th>총 도전</th>
                  </tr>
                </thead>
                <tbody>
                  {perStudent.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted">
                        아직 기록이 없어요.
                      </td>
                    </tr>
                  )}
                  {perStudent.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>
                        {s.clearedLevels} / {LEVELS.length}
                      </td>
                      <td>{s.plays}회</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {levelFilter !== 'all' && (
              <p className="muted">
                레벨 필터가 선택되어 아래 완료 판 목록은 해당 레벨만 집계됩니다. 완료 판 수:{' '}
                {filtered.length}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
