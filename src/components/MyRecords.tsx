import { useEffect, useState } from 'react';
import type { PlayRecord, Student } from '../types';
import { LEVELS } from '../data/levels';
import { fetchPlaysByStudent } from '../repo/records';

interface Props {
  student: Student;
  onBack: () => void;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function MyRecords({ student, onBack }: Props) {
  const [plays, setPlays] = useState<PlayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPlaysByStudent(student.studentId)
      .then((p) => {
        if (alive) setPlays(p);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [student.studentId]);

  return (
    <div className="screen">
      <header className="pagehead">
        <div>
          <h1 className="pagehead__title">내 기록</h1>
          <p className="pagehead__sub">
            {student.name} ({student.studentId})
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← 레벨 선택
        </button>
      </header>

      {loading ? (
        <p className="muted">불러오는 중…</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>레벨</th>
                <th>도전</th>
                <th>최고 시간</th>
                <th>최소 색</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lv) => {
                const mine = plays.filter((p) => p.levelId === lv.id);
                const attempts = mine.length;
                const bestTime = attempts ? Math.min(...mine.map((p) => p.durationSec)) : null;
                const bestColors = attempts ? Math.min(...mine.map((p) => p.colorsUsed)) : null;
                return (
                  <tr key={lv.id} className={attempts ? '' : 'row--empty'}>
                    <td>{lv.title}</td>
                    <td>{attempts ? `${attempts}회` : '-'}</td>
                    <td>{bestTime != null ? fmtTime(bestTime) : '-'}</td>
                    <td>{bestColors != null ? `${bestColors}색` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
