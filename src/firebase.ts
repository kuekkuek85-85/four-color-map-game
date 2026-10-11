import type { Firestore } from 'firebase/firestore';

// Firebase 는 "선택 사항"이다. 환경변수가 모두 채워져 있으면 Firestore 를
// 초기화하고, 하나라도 비어 있으면 null 을 반환해 앱이 오프라인(localStorage)
// 모드로 동작하게 한다. 덕분에 설정 없이도 게임 전체를 체험할 수 있다.
//
// 또한 firebase SDK 는 동적 import 로 불러온다. 설정이 없으면 SDK 번들을
// 전혀 내려받지 않아 게임 코어가 가볍게 로딩된다(학교 와이파이 대응).

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
