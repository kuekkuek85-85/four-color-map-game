import type { Level, PlayRecord, Student } from '../types';
import { LEVELS } from '../data/levels';

interface Props {
  student: Student;
  bestByLevel: Record<string, PlayRecord | undefined>;
  onPick: (level: Level) => void;
  onMyRecords: () => void;
  onLogout: () => void;
}

const DIFF_LABEL: Record<number, string> = { 1: '입문', 2: '기본', 3: '도전' };

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function LevelSelect({
  student,
  bestByLevel,
  onPick,
  onMyRecords,
  onLogout,
}: Props) {
  return (
    <div className="screen">
      <header className="pagehead">
        <div>
          <h1 className="pagehead__title">레벨 선택</h1>
          <p className="pagehead__sub">
            {student.name} ({student.studentId}) 님, 쉬운 것부터 차근차근!
          </p>
        </div>
        <div className="pagehead__actions">
          <button type="button" className="btn btn--ghost" onClick={onMyRecords}>
            🏅 내 기록
          </button>
          <button type="button" className="btn btn--ghost" onClick={onLogout}>
            나가기
          </button>
        </div>
      </header>

      <ul className="levels">
        {LEVELS.map((lv, i) => {
          const best = bestByLevel[lv.id];
          const cleared = Boolean(best);
          return (
            <li key={lv.id}>
              <button
                type="button"
                className={'levelcard' + (cleared ? ' levelcard--clear' : '')}
                onClick={() => onPick(lv)}
              >
                <span className="levelcard__index">{i + 1}</span>
                <span className="levelcard__body">
                  <span className="levelcard__title">
                    {lv.title}
                    {cleared && <span className="levelcard__badge">✓ 클리어</span>}
                  </span>
                  <span className="levelcard__blurb">{lv.blurb}</span>
                  <span className="levelcard__meta">
                    <span className={`tag tag--d${lv.difficulty}`}>{DIFF_LABEL[lv.difficulty]}</span>
                    <span className="tag">영역 {lv.nodes.length}개</span>
                    {best ? (
                      <span className="tag tag--best">
                        최고 {fmtTime(best.durationSec)} · {best.colorsUsed}색
                      </span>
                    ) : (
                      <span className="tag tag--muted">도전해 보세요</span>
                    )}
                  </span>
                </span>
                <span className="levelcard__go" aria-hidden>
                  ▶
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
