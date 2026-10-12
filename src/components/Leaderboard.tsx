import { useEffect, useMemo, useState } from 'react';
import type { Student } from '../types';
import { LEVELS } from '../data/levels';
import { fetchAllPlays, storageMode } from '../repo/records';
import { buildLeaderboard, type RankRow } from '../lib/leaderboard';

interface Props {
  /** 현재 로그인 학생(있으면 내 등수 강조). 교사 모드면 null */
  student: Student | null;
  onBack: () => void;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ student, onBack }: Props) {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    fetchAllPlays()
      .then((p) => setRows(buildLeaderboard(p)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const myRow = useMemo(
    () => (student ? rows.find((r) => r.studentId === student.studentId) : undefined),
    [rows, student],
  );

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? rows.filter((r) => r.studentId.includes(q) || r.name.toLowerCase().includes(q))
        : rows,
    [rows, q],
  );

  const total = rows.length;

  return (
    <div className="screen">
      <header className="pagehead">
        <div>
          <h1 className="pagehead__title">🏆 순위표</h1>
          <p className="pagehead__sub">
            많이 깰수록, 빠를수록 높은 순위! (전체 레벨 {LEVELS.length}개)
          </p>
        </div>
        <div className="pagehead__actions">
          <button type="button" className="btn btn--ghost" onClick={load}>
            ⟳ 새로고침
          </button>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            ← 돌아가기
          </button>
        </div>
      </header>

      {/* 내 등수 배너 */}
      {student && (
        <div className="myrank">
          {myRow ? (
            <>
              <span className="myrank__badge">{myRow.rank}위</span>
              <span className="myrank__text">
                <b>
                  {student.name} ({student.studentId})
                </b>{' '}
                님은 전체 {total}명 중 <b>{myRow.rank}위</b>예요. (클리어 {myRow.cleared}개 ·
                총 {fmtTime(myRow.totalSec)})
              </span>
            </>
          ) : (
            <span className="myrank__text">
              아직 완료한 기록이 없어요. 레벨을 클리어하면 순위에 올라요!
            </span>
          )}
        </div>
      )}

      {/* 등수 검색 */}
      <div className="lb-search">
        <input
          className="field__input"
          placeholder="학번·이름으로 내 등수 찾기"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="순위 검색"
        />
        {q && (
          <button type="button" className="btn btn--ghost" onClick={() => setSearch('')}>
            지우기
          </button>
        )}
      </div>

      {loading ? (
        <p className="muted">불러오는 중…</p>
      ) : total === 0 ? (
        <p className="muted">아직 순위에 오른 학생이 없어요.</p>
      ) : (
        <div className="table-wrap">
          <table className="table lb-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>이름</th>
                <th>학번</th>
                <th>클리어</th>
                <th>총 시간</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isMe = student?.studentId === r.studentId;
                return (
                  <tr key={r.studentId} className={isMe ? 'lb-row--me' : ''}>
                    <td className="lb-rank">
                      {r.rank <= 3 ? <span className="lb-medal">{MEDAL[r.rank - 1]}</span> : null}
                      {r.rank}
                    </td>
                    <td>
                      {r.name}
                      {isMe && <span className="lb-me-tag">나</span>}
                    </td>
                    <td>{r.studentId}</td>
                    <td>
                      {r.cleared} / {LEVELS.length}
                    </td>
                    <td>{fmtTime(r.totalSec)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    “{search}”에 해당하는 학생이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted">
        순위 기준: 클리어한 레벨 수(많을수록 위) → 총 소요시간(짧을수록 위).
        {storageMode === 'local' && ' (오프라인 모드: 이 기기 기록만)'}
      </p>
    </div>
  );
}
