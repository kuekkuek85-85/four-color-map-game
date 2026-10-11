import type { Level } from '../types';
import type { GameResult } from './Game';

interface Props {
  level: Level;
  result: GameResult;
  saving: boolean;
  saveError: string | null;
  isBest: boolean;
  nextLevel: Level | null;
  onReplay: () => void;
  onNext: () => void;
  onLevels: () => void;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function Complete({
  level,
  result,
  saving,
  saveError,
  isBest,
  nextLevel,
  onReplay,
  onNext,
  onLevels,
}: Props) {
  const minColorBonus = result.colorsUsed <= level.minColors;
  return (
    <div className="screen screen--center">
      <div className="card complete">
        <div className="complete__burst" aria-hidden>
          🎉
        </div>
        <h1 className="complete__title">완성!</h1>
        <p className="complete__sub">
          {level.title} 지도를 규칙에 맞게 칠했어요.
          {isBest && <b className="complete__pb"> 🏅 최고 기록 경신!</b>}
        </p>

        <dl className="result">
          <div className="result__row">
            <dt>소요 시간</dt>
            <dd>{fmtTime(result.durationSec)}</dd>
          </div>
          <div className="result__row">
            <dt>사용한 색</dt>
            <dd>
              {result.colorsUsed}색
              {minColorBonus && <span className="result__bonus"> · 최소 색 달성!</span>}
            </dd>
          </div>
          <div className="result__row">
            <dt>틀린 선택</dt>
            <dd>{result.violations}회</dd>
          </div>
        </dl>

        <p className="complete__save" role="status">
          {saving
            ? '기록 저장 중…'
            : saveError
              ? `기록 저장에 실패했어요 (${saveError}). 결과는 화면에 그대로 있어요.`
              : '기록이 저장되었어요.'}
        </p>

        <div className="complete__actions">
          <button type="button" className="btn" onClick={onReplay}>
            ⟳ 다시 도전
          </button>
          {nextLevel ? (
            <button type="button" className="btn btn--primary" onClick={onNext}>
              다음 레벨 ▶
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={onLevels}>
              레벨 선택으로
            </button>
          )}
        </div>
        <button type="button" className="btn btn--ghost" onClick={onLevels}>
          레벨 선택으로
        </button>
      </div>
    </div>
  );
}
