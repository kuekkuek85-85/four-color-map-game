import { useEffect, useMemo, useState } from 'react';
import type { Level, PlayRecord, Student } from './types';
import { LEVELS } from './data/levels';
import { clearSession, loadSession, saveSession } from './store';
import { fetchPlaysByStudent, savePlay, upsertStudent } from './repo/records';
import Login from './components/Login';
import LevelSelect from './components/LevelSelect';
import Game, { type GameResult } from './components/Game';
import Complete from './components/Complete';
import MyRecords from './components/MyRecords';
import TeacherDashboard from './components/TeacherDashboard';

type Screen = 'login' | 'levels' | 'game' | 'complete' | 'myrecords' | 'teacher';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [student, setStudent] = useState<Student | null>(null);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [plays, setPlays] = useState<PlayRecord[]>([]);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isBest, setIsBest] = useState(false);

  // 세션 복원(재접속 연속성)
  useEffect(() => {
    const s = loadSession();
    if (s) {
      setStudent(s);
      setScreen('levels');
      refreshPlays(s.studentId);
      upsertStudent(s).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPlays = (studentId: string) => {
    fetchPlaysByStudent(studentId)
      .then(setPlays)
      .catch(() => setPlays([]));
  };

  const bestByLevel = useMemo(() => {
    const map: Record<string, PlayRecord | undefined> = {};
    for (const p of plays) {
      const cur = map[p.levelId];
      if (!cur || p.durationSec < cur.durationSec) map[p.levelId] = p;
    }
    return map;
  }, [plays]);

  const handleLogin = (s: Student) => {
    setStudent(s);
    saveSession(s);
    upsertStudent(s).catch(() => {});
    refreshPlays(s.studentId);
    setScreen('levels');
  };

  const handleLogout = () => {
    clearSession();
    setStudent(null);
    setPlays([]);
    setScreen('login');
  };

  const startLevel = (lv: Level) => {
    setCurrentLevel(lv);
    setGameKey((k) => k + 1);
    setScreen('game');
  };

  const handleComplete = async (result: GameResult) => {
    if (!student || !currentLevel) return;
    setLastResult(result);
    const prevBest = bestByLevel[currentLevel.id];
    setIsBest(!prevBest || result.durationSec < prevBest.durationSec);

    const record: PlayRecord = {
      studentId: student.studentId,
      name: student.name,
      levelId: currentLevel.id,
      durationSec: result.durationSec,
      colorsUsed: result.colorsUsed,
      violations: result.violations,
      undos: result.undos,
      completedAt: Date.now(),
    };
    // 화면은 바로 전환하고 저장은 뒤에서 처리
    setScreen('complete');
    setSaving(true);
    setSaveError(null);
    // 낙관적 반영
    setPlays((p) => [...p, record]);
    try {
      await savePlay(record);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setSaving(false);
    }
  };

  const nextLevel = useMemo(() => {
    if (!currentLevel) return null;
    const idx = LEVELS.findIndex((l) => l.id === currentLevel.id);
    return idx >= 0 && idx + 1 < LEVELS.length ? LEVELS[idx + 1] : null;
  }, [currentLevel]);

  return (
    <div className="app">
      {screen === 'login' && (
        <Login
          initial={student}
          onStudentLogin={handleLogin}
          onTeacher={() => setScreen('teacher')}
        />
      )}

      {screen === 'levels' && student && (
        <LevelSelect
          student={student}
          bestByLevel={bestByLevel}
          onPick={startLevel}
          onMyRecords={() => setScreen('myrecords')}
          onLogout={handleLogout}
        />
      )}

      {screen === 'game' && currentLevel && (
        <Game
          key={gameKey}
          level={currentLevel}
          onComplete={handleComplete}
          onBack={() => setScreen('levels')}
        />
      )}

      {screen === 'complete' && currentLevel && lastResult && (
        <Complete
          level={currentLevel}
          result={lastResult}
          saving={saving}
          saveError={saveError}
          isBest={isBest}
          nextLevel={nextLevel}
          onReplay={() => startLevel(currentLevel)}
          onNext={() => nextLevel && startLevel(nextLevel)}
          onLevels={() => setScreen('levels')}
        />
      )}

      {screen === 'myrecords' && student && (
        <MyRecords student={student} onBack={() => setScreen('levels')} />
      )}

      {screen === 'teacher' && (
        <TeacherDashboard onBack={() => setScreen(student ? 'levels' : 'login')} />
      )}
    </div>
  );
}
