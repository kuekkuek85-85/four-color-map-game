import { useState } from 'react';
import type { Student } from '../types';
import { validateName, validateStudentId } from '../store';
import { storageMode } from '../repo/records';

interface Props {
  initial?: Student | null;
  onStudentLogin: (student: Student) => void;
  onTeacher: () => void;
}

export default function Login({ initial, onStudentLogin, onTeacher }: Props) {
  const [studentId, setStudentId] = useState(initial?.studentId ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [touched, setTouched] = useState(false);

  const idErr = validateStudentId(studentId);
  const nameErr = validateName(name);
  const valid = !idErr && !nameErr;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onStudentLogin({ studentId, name: name.trim() });
  };

  return (
    <div className="screen screen--center">
      <div className="card login">
        <div className="login__logo" aria-hidden>
          🗺️🎨
        </div>
        <h1 className="login__title">4색 지도 칠하기</h1>
        <p className="login__sub">이웃한 영역이 같은 색이 되지 않게 칠해 보세요!</p>

        <form onSubmit={submit} className="login__form">
          <label className="field">
            <span className="field__label">학번 (숫자 5자리)</span>
            <input
              className="field__input"
              inputMode="numeric"
              pattern="\d*"
              maxLength={5}
              placeholder="예) 10203"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 5))}
              autoComplete="off"
            />
            {touched && idErr && <span className="field__err">{idErr}</span>}
          </label>

          <label className="field">
            <span className="field__label">성명 (1~10자)</span>
            <input
              className="field__input"
              maxLength={10}
              placeholder="예) 김정보"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
            {touched && nameErr && <span className="field__err">{nameErr}</span>}
          </label>

          <button type="submit" className="btn btn--primary btn--big" disabled={!valid}>
            시작하기
          </button>
        </form>

        <button type="button" className="btn btn--ghost login__teacher" onClick={onTeacher}>
          👩‍🏫 교사 모드
        </button>

        <p className="login__note">
          {storageMode === 'firestore'
            ? '기록이 선생님 현황판에 함께 모여요.'
            : '지금은 오프라인 모드예요. 기록은 이 기기에만 저장됩니다.'}
        </p>
      </div>
    </div>
  );
}
