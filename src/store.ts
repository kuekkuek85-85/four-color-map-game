import type { Student } from './types';

// 로그인 세션(학번·성명)을 localStorage 로 유지해 재입력을 최소화한다.

const KEY = 'fourcolor.session';

export function loadSession(): Student | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Student;
    if (s && typeof s.studentId === 'string' && typeof s.name === 'string') return s;
    return null;
  } catch {
    return null;
  }
}

export function saveSession(student: Student): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(student));
  } catch {
    /* 무시 */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

// ---- 유효성 검사 ----

export function validateStudentId(id: string): string | null {
  if (!/^\d{5}$/.test(id)) return '학번은 숫자 5자리여야 해요.';
  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 1) return '성명을 입력해 주세요.';
  if (trimmed.length > 10) return '성명은 10자 이내로 입력해 주세요.';
  return null;
}
