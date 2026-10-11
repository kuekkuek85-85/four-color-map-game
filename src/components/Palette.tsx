import { PALETTE } from '../lib/colors';

interface Props {
  active: number;
  onPick: (n: number) => void;
}

/** 4색 팔레트 + "지우개"(선택 색을 다시 탭하면 비우기이지만, 명시 지우개도 제공). */
export default function Palette({ active, onPick }: Props) {
  return (
    <div className="palette" role="radiogroup" aria-label="색 팔레트">
      {PALETTE.map((p) => (
        <button
          key={p.n}
          type="button"
          role="radio"
          aria-checked={active === p.n - 1}
          aria-label={`${p.n}번 ${p.name}`}
          className={'swatch' + (active === p.n - 1 ? ' swatch--active' : '')}
          style={{ background: p.fill, color: p.ink }}
          onClick={() => onPick(p.n - 1)}
        >
          {p.n}
        </button>
      ))}
    </div>
  );
}
