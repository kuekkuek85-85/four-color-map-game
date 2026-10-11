import { getDb, firebaseEnabled } from '../firebase';
import type { PlayRecord, Student } from '../types';

// 기록 저장소. Firebase 가 설정돼 있으면 Firestore 에, 아니면 localStorage 에
// 저장한다. 두 경우 모두 같은 인터페이스를 노출한다.
// firestore SDK 함수는 동적 import 로 불러와 초기 번들을 가볍게 유지한다.

const LS_PLAYS = 'fourcolor.plays';
const LS_STUDENTS = 'fourcolor.students';

export const storageMode: 'firestore' | 'local' = firebaseEnabled ? 'firestore' : 'local';

// ---- localStorage 유틸 ----

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 실패는 무시(사생활 모드 등) */
  }
}

// ---- 학생 upsert(재접속 연속성) ----

export async function upsertStudent(student: Student): Promise<void> {
  const db = await getDb();
  if (db) {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const ref = doc(db, 'students', student.studentId);
    await setDoc(
      ref,
      {
        studentId: student.studentId,
        name: student.name,
        lastSeenAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }
  const students = readLocal<Student & { lastSeenAt: number }>(LS_STUDENTS);
  const idx = students.findIndex((s) => s.studentId === student.studentId);
  const now = Date.now();
  if (idx >= 0) {
    students[idx] = { ...students[idx], name: student.name, lastSeenAt: now };
  } else {
    students.push({ ...student, lastSeenAt: now });
  }
  writeLocal(LS_STUDENTS, students);
}

// ---- 완료 기록 저장 ----

export async function savePlay(record: PlayRecord): Promise<void> {
  const db = await getDb();
  if (db) {
    const { addDoc, collection, Timestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'plays'), {
      ...record,
      completedAt: Timestamp.fromMillis(record.completedAt),
    });
    return;
  }
  const plays = readLocal<PlayRecord>(LS_PLAYS);
  plays.push(record);
  writeLocal(LS_PLAYS, plays);
}

// ---- 전체 기록 조회(집계용) ----

export async function fetchAllPlays(): Promise<PlayRecord[]> {
  const db = await getDb();
  if (db) {
    const { collection, getDocs, query, Timestamp } = await import('firebase/firestore');
    const snap = await getDocs(query(collection(db, 'plays')));
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const completedAt = data.completedAt;
      let ms = Date.now();
      if (completedAt instanceof Timestamp) ms = completedAt.toMillis();
      else if (typeof completedAt === 'number') ms = completedAt;
      return {
        studentId: String(data.studentId ?? ''),
        name: String(data.name ?? ''),
        levelId: String(data.levelId ?? ''),
        durationSec: Number(data.durationSec ?? 0),
        colorsUsed: Number(data.colorsUsed ?? 0),
        violations: Number(data.violations ?? 0),
        undos: Number(data.undos ?? 0),
        completedAt: ms,
      } satisfies PlayRecord;
    });
  }
  return readLocal<PlayRecord>(LS_PLAYS);
}

// ---- 특정 학생의 기록 ----

export async function fetchPlaysByStudent(studentId: string): Promise<PlayRecord[]> {
  const all = await fetchAllPlays();
  return all.filter((p) => p.studentId === studentId);
}
