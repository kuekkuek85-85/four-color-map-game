# 4색 지도 칠하기 게임 🗺️🎨

중학교 1학년 정보 수업용 **4색 지도 칠하기** 웹 게임입니다. 학생이 학번(5자리)·성명으로
접속해 **인접한 영역이 같은 색이 되지 않도록** 4가지 색으로 지도를 칠하고, 완료 기록이
저장되어 교사 현황판에서 반 전체가 함께 봅니다.

> 화면과 피드백은 수학 용어 없이 "지도 칠하기 게임"으로만 보이도록 했습니다.
> 그래프 인접·제약 조건 충족(CSP)·백트래킹 같은 교육 개념은 교사가 수업에서 드러냅니다.

## 주요 기능

- **로그인**: 학번(숫자 5자리)·성명(1~10자) 입력, 즉시 유효성 검사, 세션 유지(재입력 최소화)
- **게임 플레이**: SVG 지도 렌더링, 4색 팔레트, 탭/클릭으로 칠하기(재탭으로 변경·비움)
- **실시간 피드백**: 인접한 두 영역이 같은 색이면 테두리 강조·흔들림으로 즉시 표시
- **보조 기능**: 되돌리기(undo), 초기화(reset), 힌트(백트래킹 기반 안전한 한 수), 사용 색 수 표시
- **레벨**: 난이도순 5개 레벨(입문 → 기본 → 도전: 단순화한 대한민국 지도), 클리어·최고 기록 표시
- **기록 저장**: 완료 시 소요 시간·사용 색 수·틀린 횟수·되돌리기 횟수 저장
- **대시보드**: 학생 "내 기록", 교사 "현황판"(참여 수·레벨별 완료율·평균 시간, 학번순 정렬, 검색/필터)
- **접근성**: 색각 이상 대응(각 색에 번호 1~4 병행 표시), 큰 터치 영역, 모션 최소화 지원, 다크 모드

## 기술 스택

- **프런트**: React + TypeScript + Vite (정적 웹앱), 지도는 SVG 렌더링
- **데이터**: Firebase Firestore (`students` / `plays`) — **선택 사항**
- **배포**: Vercel (GitHub 연동 자동 배포)

## 로컬 실행

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # 타입체크 + 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
npm run validate:levels   # 레벨 데이터(인접·최소 색 수) 검증
```

## Firebase 연결

이 앱은 `four-color-map-game` Firebase 프로젝트에 **기본 연결**되도록 설정되어 있습니다
(`src/firebase.ts`의 기본 설정). Firebase 웹 설정값(apiKey 등)은 비밀이 아니라 공개용
식별자이며, 실제 보호는 아래 **Firestore 보안 규칙**으로 합니다. 다른 프로젝트를 쓰려면
`VITE_FIREBASE_*` 환경변수로 덮어쓸 수 있습니다(환경변수가 기본 설정보다 우선).

> Firebase에 연결할 수 없는 환경(네트워크 차단 등)에서는 저장이 실패해도 게임은 그대로
> 동작하고, 기록은 저장되지 않습니다.

### 저장이 되게 하려면 — 보안 규칙 게시 (필수)

Firestore 데이터베이스가 만들어져 있어도 **보안 규칙을 게시하기 전에는 쓰기가 거부**되어
("Missing or insufficient permissions") 기록이 저장되지 않습니다. 저장소의 `firestore.rules`
내용을 게시하세요.

- 가장 쉬운 방법: [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트
  `four-color-map-game` → **Firestore Database → 규칙(Rules)** 탭 → `firestore.rules`
  내용을 붙여넣고 **게시(Publish)**.
- 또는 Firebase CLI:

  ```bash
  firebase deploy --only firestore:rules
  ```

Firestore 데이터베이스를 아직 만들지 않았다면 콘솔에서 **Firestore Database → 데이터베이스
만들기**를 먼저 진행하세요.

## Vercel 배포

1. 이 저장소를 GitHub에 올리고 Vercel 프로젝트로 가져옵니다.
2. 프레임워크 프리셋은 **Vite**(자동 감지). 빌드 명령 `npm run build`, 출력 디렉터리 `dist`.
3. Firebase는 기본 설정으로 연결되므로 환경변수 없이도 배포됩니다. 다른 프로젝트를
   쓰려면 `VITE_FIREBASE_*` 값을 Vercel 환경변수에 등록해 덮어씁니다.
4. `main` 브랜치 머지 시 자동 배포, PR마다 미리보기 URL이 생성됩니다.

## 데이터 모델 (Firestore)

| 컬렉션 | 문서 ID | 주요 필드 |
| --- | --- | --- |
| `students` | 학번(5자리, 문자열) | `studentId`, `name`, `createdAt`, `lastSeenAt` |
| `plays` | 자동 ID | `studentId`, `name`, `levelId`, `durationSec`, `colorsUsed`, `violations`, `undos`, `completedAt` |

> 학번은 앞자리 0 보존을 위해 **문자열**로 저장합니다. 지도 정의(`levels`)는 양이 적어
> 코드 상수(`src/data/levels.ts`)로 관리합니다.

## 지도(레벨) 구조

레벨은 `src/data/levels.ts`에서 도형으로부터 생성합니다.

- **사각형 타일 지도**: 영역을 사각형(여러 개 가능)으로 배치하면 인접 관계를 **자동 계산**합니다.
  변을 일정 길이 이상 맞대야 인접으로 보고, **한 꼭짓점에서만 닿으면 인접이 아닙니다**(4색 정리 전제).
- **방사형(바퀴·꽃) 지도**: 가운데 원 + 바깥 고리(부채꼴). 홀수 고리는 4색이 필요합니다.
- 각 레벨의 **최소 색 수**는 그래프에서 백트래킹으로 계산(`chromaticNumber`)하므로
  "보이는 지도"와 "데이터"가 항상 일치합니다. `npm run validate:levels`로 확인하세요.

## 폴더 구조

```
src/
  components/     화면 컴포넌트 (Login, LevelSelect, Game, Complete, MyRecords, TeacherDashboard, MapView, Palette)
  data/levels.ts  레벨(지도) 정의
  lib/            game.ts(규칙·판정·힌트·최소색), geometry.ts(도형·인접), colors.ts(팔레트)
  repo/records.ts 기록 저장소 (Firestore / localStorage 자동 전환)
  firebase.ts     Firebase 초기화(환경변수 없으면 비활성)
  store.ts        세션 유지·유효성 검사
scripts/validateLevels.ts   레벨 검증 CLI
firestore.rules   Firestore 보안 규칙
```
