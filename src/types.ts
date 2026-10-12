// 공용 타입 정의

/** 지도의 한 영역(노드). */
export interface MapNode {
  /** 레벨 내에서 고유한 영역 ID */
  id: string;
  /** 화면에 표시할 이름(실제 지도 레벨에서 사용). 없으면 번호만 표시 */
  label?: string;
  /** SVG path `d` 조각들. 하나의 영역이 여러 조각(멀티 폴리곤)일 수 있다. */
  shapes: string[];
  /**
   * 외곽선 전용 path(선택). 여러 사각형으로 된 영역에서 내부 경계선을 없애고
   * 바깥 테두리만 그릴 때 사용한다. 없으면 shapes 를 그대로 테두리로 쓴다.
   */
  outline?: string;
  /** 라벨/번호를 표시할 중심 좌표 */
  centroid: { x: number; y: number };
}

/** 영역 정의 + 인접 관계로 구성된 레벨(지도). */
export interface Level {
  id: string;
  title: string;
  /** 1=입문, 2=기본, 3=도전 */
  difficulty: number;
  /** 난이도 설명 한 줄 */
  blurb: string;
  nodes: MapNode[];
  /**
   * 인접 관계(간선). [a, b] 는 영역 a 와 b 가 변을 맞대고 있음을 뜻한다.
   * 한 점(꼭짓점)에서만 만나는 경우는 인접으로 보지 않는다 — 4색 정리의 전제.
   */
  edges: [string, string][];
  /** 이 지도를 규칙에 맞게 칠하는 데 필요한 최소 색 수 */
  minColors: number;
  /** SVG viewBox */
  viewBox: { w: number; h: number };
}

/** 완료 1판의 기록. */
export interface PlayRecord {
  studentId: string;
  name: string;
  levelId: string;
  durationSec: number;
  colorsUsed: number;
  violations: number;
  undos: number;
  completedAt: number; // epoch ms
}

/** 학생 식별 정보. */
export interface Student {
  studentId: string;
  name: string;
}
