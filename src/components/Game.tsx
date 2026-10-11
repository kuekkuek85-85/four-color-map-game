import { useEffect, useMemo, useRef, useState } from 'react';
import type { Level } from '../types';
import {
  adjacency,
  allColored,
  colorsUsed,
  findViolations,
  isComplete,
  violatingNodes,
  type Coloring,
} from '../lib/game';
import type { ColorChoice } from '../lib/colors';
import MapView from './MapView';
import Palette from './Palette';

export interface GameResult {
  durationSec: number;
  colorsUsed: number;
  violations: number;
  undos: number;
}

interface Props {
  level: Level;
  slots: ColorChoice[];
  onChangeSlot: (index: number, colorId: string) => void;
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

function emptyColoring(level: Level): Coloring {
  const c: Coloring = {};
  for (const n of level.nodes) c[n.id] = null;
  return c;
}

export default function Game({ level, slots, onChangeSlot, onComplete, onBack }: Props) {
  const [coloring, setColoring] = useState<Coloring>(() => emptyColoring(level));
  const [active, setActive] = useState(0);
  const [violations, setViolations] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  const startRef = useRef<number>(Date.now());
  const adj = useMemo(() => adjacency(level), [level]);
  const violating = useMemo(() => violatingNodes(level, coloring), [level, coloring]);
  const usedCount = colorsUsed(coloring);

  // 타이머
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [done]);

  // 완료 판정
  useEffect(() => {
    if (done) return;
    if (isComplete(level, coloring)) {
      setDone(true);
      const durationSec = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));
      onComplete({
        durationSec,
        colorsUsed: colorsUsed(coloring),
        violations,
        undos: 0,
      });
    }
  }, [coloring, done, level, onComplete, violations]);

  const paint = (nodeId: string) => {
    if (done) return;
    const current = coloring[nodeId];
    const next = current === active ? null : active;
    const updated = { ...coloring, [nodeId]: next };
    setColoring(updated);
    // 위반(틀린 선택) 집계: 새로 칠한 색이 이웃과 같으면 1회 증가
    if (next != null) {
      const conflict = (adj.get(nodeId) ?? []).some((nb) => updated[nb] === next);
      if (conflict) setViolations((v) => v + 1);
    }
  };

  const reset = () => {
    if (done) return;
    setColoring(emptyColoring(level));
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const violationCount = findViolations(level, coloring).length;
  const colored = allColored(level, coloring);

  return (
    <div className="game">
      <header className="game__top">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← 레벨 선택
        </button>
        <h2 className="game__title">{level.title}</h2>
        <div className="game__timer" aria-label="소요 시간">
          ⏱ {mm}:{ss}
        </div>
      </header>

      <div className="game__stats" aria-live="polite">
        <span className="chip">사용 색 {usedCount}개</span>
        <span className={'chip' + (violationCount > 0 ? ' chip--warn' : '')}>
          {violationCount > 0 ? `같은 색 이웃 ${violationCount}곳` : '같은 색 이웃 없음'}
        </span>
        <span className="chip">
          {colored ? '모두 칠함' : `남은 칸 ${level.nodes.filter((n) => coloring[n.id] == null).length}`}
        </span>
      </div>

      <div className="game__board">
        <MapView
          level={level}
          coloring={coloring}
          slots={slots}
          violating={violating}
          onPaint={paint}
        />
      </div>

      <Palette active={active} onPick={setActive} slots={slots} onChangeSlot={onChangeSlot} />

      <div className="game__actions">
        <button type="button" className="btn" onClick={reset}>
          ⟳ 처음부터
        </button>
      </div>

      <p className="game__help">
        색을 고른 뒤 영역을 탭하면 칠해져요. 같은 색을 다시 탭하면 비워집니다. 목표:{' '}
        <b>이웃한 영역끼리 같은 색이 되지 않게</b> 모두 칠하기!
      </p>
    </div>
  );
}
