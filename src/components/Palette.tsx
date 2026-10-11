import { useEffect, useRef, useState } from 'react';
import { COLOR_CHOICES, type ColorChoice } from '../lib/colors';

interface Props {
  /** 4개 슬롯에 현재 들어 있는 색 */
  slots: ColorChoice[];
  /** 활성(선택된) 슬롯 인덱스 0~3 */
  active: number;
  /** 슬롯을 활성으로 선택 */
  onPick: (index: number) => void;
  /** 슬롯의 색을 바꿈 */
  onChangeSlot: (index: number, colorId: string) => void;
}

/**
 * 4색 팔레트. 슬롯(번호 1~4)은 고정이고, 각 슬롯을 탭하면 활성 색이 된다.
 * 슬롯 모서리의 "색 바꾸기" 배지(✎)를 누르면 색 선택 팝오버가 열려,
 * 더 많은 색 중에서 그 슬롯의 색을 바꿀 수 있다.
 */
export default function Palette({ slots, active, onPick, onChangeSlot }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 바깥을 탭하면 팝오버 닫기
  useEffect(() => {
    if (openIndex === null) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [openIndex]);

  const openColor = openIndex !== null ? slots[openIndex] : null;

  return (
    <div className="palette" ref={wrapRef} role="group" aria-label="색 팔레트">
      {slots.map((c, i) => {
        const n = i + 1;
        const isActive = active === i;
        const isOpen = openIndex === i;
        return (
          <div className="slot" key={i}>
            <button
              type="button"
              aria-pressed={isActive}
              aria-label={`${n}번 색 (${c.name}) 선택`}
              className={'swatch' + (isActive ? ' swatch--active' : '')}
              style={{ background: c.fill, color: c.ink }}
              onClick={() => onPick(i)}
            >
              {n}
            </button>
            <button
              type="button"
              className="slot__edit"
              aria-label={`${n}번 색 바꾸기`}
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              ✎
            </button>
          </div>
        );
      })}

      {/* 색 고르기 팝오버 — 어느 슬롯을 눌러도 화면 중앙 위에 띄워 잘리지 않게 한다. */}
      {openIndex !== null && openColor && (
        <div className="picker" role="menu" aria-label={`${openIndex + 1}번 색 고르기`}>
          <div className="picker__title">{openIndex + 1}번 색 고르기</div>
          <div className="picker__grid">
            {COLOR_CHOICES.map((choice) => {
              const usedElsewhere = slots.some((s, si) => si !== openIndex && s.id === choice.id);
              const selected = openColor.id === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  aria-label={choice.name + (usedElsewhere ? ' (다른 번호가 사용 중)' : '')}
                  title={choice.name + (usedElsewhere ? ' (다른 번호 사용 중)' : '')}
                  className={
                    'picker__swatch' +
                    (selected ? ' picker__swatch--sel' : '') +
                    (usedElsewhere ? ' picker__swatch--used' : '')
                  }
                  style={{ background: choice.fill, color: choice.ink }}
                  onClick={() => {
                    onChangeSlot(openIndex, choice.id);
                    setOpenIndex(null);
                  }}
                >
                  {usedElsewhere ? '·' : selected ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
