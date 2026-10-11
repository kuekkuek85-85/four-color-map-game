import type { Firestore } from 'firebase/firestore';

// Firebase 는 "선택 사항"이다. 환경변수가 모두 채워져 있으면 Firestore 를
// 초기화하고, 하나라도 비어 있으면 null 을 반환해 앱이 오프라인(localStorage)
// 모드로 동작하게 한다. 덕분에 설정 없이도 게임 전체를 체험할 수 있다.
//
// 또한 firebase SDK 는 동적 import 로 불러온다. 설정이 없으면 SDK 번들을
// 전혀 내려받지 않아 게임 코어가 가볍게 로딩된다(학교 와이파이 대응).

// 기본 Firebase 웹 설정.
// Firebase 웹 config(apiKey 등)는 "비밀"이 아니라 공개용 식별자다. 브라우저로
// 배포되는 앱 번들에 어차피 포함되며, 실제 데이터 보호는 Firestore 보안 규칙
// (firestore.rules)으로 한다. 따라서 소스에 두어도 안전하고, 이렇게 하면 별도
// 환경변수 설정 없이도 배포 즉시 Firebase가 연결된다.
// 환경변수(VITE_FIREBASE_*)가 주어지면 그 값이 우선한다.
const fallback = {
  apiKey: 'AIzaSyDvTssG-edEW4CKPBjdcETH_vN-NWg7COo',
  authDomain: 'four-color-map-game.firebaseapp.com',
  projectId: 'four-color-map-game',
  storageBucket: 'four-color-map-game.firebasestorage.app',
  messagingSenderId: '669196116973',
  appId: '1:669196116973:web:75b8f96da3fe1d8e4f7de4',
};

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? fallback.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? fallback.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? fallback.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? fallback.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? fallback.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? fallback.appId,
};

export const firebaseEnabled: boolean = Boolean(
  config.apiKey && config.projectId && config.appId,
);

let dbPromise: Promise<Firestore | null> | null = null;

/** Firestore 인스턴스를 (최초 1회) 동적으로 초기화해 반환. 비활성이면 null. */
export function getDb(): Promise<Firestore | null> {
  if (!firebaseEnabled) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = (async () => {
      const [{ initializeApp }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
      ]);
      const app = initializeApp(config);
      return getFirestore(app);
    })();
  }
  return dbPromise;
}
