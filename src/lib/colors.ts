// 색 팔레트.
//
// 이 게임은 "4색"으로 칠하는 것이 핵심이므로, 칠할 수 있는 색 "슬롯"은 항상
// 4개(번호 1~4)로 고정한다. 다만 각 슬롯에 들어가는 실제 색은 학생이 아래
// 색 목록(COLOR_CHOICES) 중에서 자유롭게 고를 수 있다.
//
// 색각 이상 학생을 위해 "색만으로 구분"하지 않는다: 각 슬롯과 영역에 번호
// (1~4)를 함께 표시한다.

export interface ColorChoice {
  /** 저장·식별용 고유 id */
  id: string;
  /** 채우기 색 */
  fill: string;
  /** 색 위에 올라가는 글자(번호) 색 — 대비 확보 */
  ink: string;
  /** 접근성용 이름 */
  name: string;
}

/** 슬롯에 넣을 수 있는 색 목록. */
export const COLOR_CHOICES: ColorChoice[] = [
  { id: 'blue', fill: '#1f77d0', ink: '#ffffff', name: '파랑' },
  { id: 'sky', fill: '#4dabf7', ink: '#0b2a42', name: '하늘' },
  { id: 'teal', fill: '#0ca678', ink: '#ffffff', name: '청록' },
  { id: 'green', fill: '#2ca25f', ink: '#ffffff', name: '초록' },
  { id: 'lime', fill: '#82c91e', ink: '#1b3a00', name: '연두' },
  { id: 'yellow', fill: '#e8a33d', ink: '#3a2a00', name: '노랑' },
  { id: 'orange', fill: '#e8720c', ink: '#ffffff', name: '주황' },
  { id: 'red', fill: '#e03131', ink: '#ffffff', name: '빨강' },
  { id: 'pink', fill: '#e64980', ink: '#ffffff', name: '분홍' },
  { id: 'magenta', fill: '#ae3ec9', ink: '#ffffff', name: '자주' },
  { id: 'purple', fill: '#6741d9', ink: '#ffffff', name: '보라' },
  { id: 'indigo', fill: '#364fc7', ink: '#ffffff', name: '남색' },
  { id: 'brown', fill: '#a5682a', ink: '#ffffff', name: '갈색' },
  { id: 'gray', fill: '#868e96', ink: '#ffffff', name: '회색' },
];

/** 4개 슬롯의 기본 색 id. */
export const DEFAULT_SLOT_IDS: string[] = ['blue', 'yellow', 'green', 'pink'];

/** id로 색을 찾는다. 없으면 기본값(파랑). */
export function choiceById(id: string): ColorChoice {
  return COLOR_CHOICES.find((c) => c.id === id) ?? COLOR_CHOICES[0];
}

/** 슬롯 id 배열을 색 객체 배열로. 길이는 항상 4로 맞춘다. */
export function slotsFromIds(ids: string[]): ColorChoice[] {
  const out: ColorChoice[] = [];
  for (let i = 0; i < 4; i++) {
    out.push(choiceById(ids[i] ?? DEFAULT_SLOT_IDS[i]));
  }
  return out;
}

/** 비어 있는 영역의 기본 채우기. */
export const EMPTY_FILL = '#e7ebf3';
export const EMPTY_INK = '#8a93a6';
