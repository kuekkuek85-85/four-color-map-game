// 4색 팔레트.
// 색각 이상 학생을 위해 "색만으로 구분"하지 않는다:
//   - 각 색에 번호(1~4)를 함께 표시한다.
//   - 영역에는 색 번호를 큰 글자로 겹쳐 보여준다.
// 색은 Okabe–Ito 계열의 구분이 잘 되는 색을 고른다.

export interface Paint {
  /** 팔레트 번호(1~4) */
  n: number;
  /** 채우기 색 */
  fill: string;
  /** 영역 위 번호 글자 색(대비 확보) */
  ink: string;
  /** 접근성용 이름 */
  name: string;
}

export const PALETTE: Paint[] = [
  { n: 1, fill: '#1f77d0', ink: '#ffffff', name: '파랑' },
  { n: 2, fill: '#e8a33d', ink: '#3a2a00', name: '노랑' },
  { n: 3, fill: '#2ca25f', ink: '#ffffff', name: '초록' },
  { n: 4, fill: '#d6568c', ink: '#ffffff', name: '분홍' },
];

/** 비어 있는 영역의 기본 채우기. */
export const EMPTY_FILL = '#e7ebf3';
export const EMPTY_INK = '#8a93a6';
