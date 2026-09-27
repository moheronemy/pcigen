import { useId } from 'react';
import { ENERGY_LABELS, ENERGY_TYPES, type EnergyType } from '../model/card';

interface Props {
  label: string;
  value: EnergyType | null;
  types: readonly EnergyType[];
  onChange: (value: EnergyType | null) => void;
  /** 「なし」を選べるようにする */
  allowNone?: boolean;
}

export const TypeIcon = ({ type, size = 21 }: { type: EnergyType; size?: number }) => (
  <span
    className="type-icon"
    aria-hidden
    style={{
      width: size,
      height: size,
      backgroundSize: `${size}px ${size * ENERGY_TYPES.length}px`,
      backgroundPosition: `0 ${-ENERGY_TYPES.indexOf(type) * size}px`,
    }}
  />
);

/** タイプをアイコンのラジオボタンで選ぶ */
export const TypePicker = ({ label, value, types, onChange, allowNone }: Props) => {
  const name = useId();
  return (
    <fieldset className="type-picker">
      <legend>{label}</legend>
      {allowNone && (
        <label className="type-option" title="なし">
          <input
            type="radio"
            name={name}
            checked={value === null}
            onChange={() => onChange(null)}
          />
          <span className="type-none">なし</span>
        </label>
      )}
      {types.map((t) => (
        <label key={t} className="type-option" title={ENERGY_LABELS[t]}>
          <input type="radio" name={name} checked={value === t} onChange={() => onChange(t)} />
          <TypeIcon type={t} />
          <span className="visually-hidden">{ENERGY_LABELS[t]}</span>
        </label>
      ))}
    </fieldset>
  );
};
