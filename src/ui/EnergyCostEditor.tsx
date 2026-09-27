import { ENERGY_LABELS, MAX_COST, type EnergyType } from '../model/card';
import { TypeIcon } from './TypePicker';

interface Props {
  cost: EnergyType[];
  types: readonly EnergyType[];
  onAdd: (energy: EnergyType) => void;
  onPop: () => void;
}

/** わざに必要なエネルギーを、ボタンを押した順に積んでいく */
export const EnergyCostEditor = ({ cost, types, onAdd, onPop }: Props) => (
  <div className="energy-editor">
    <div className="energy-current" aria-label="必要なエネルギー">
      {cost.length === 0 ? (
        <span className="muted">エネルギーなし</span>
      ) : (
        cost.map((t, i) => <TypeIcon key={i} type={t} size={24} />)
      )}
      <button type="button" className="small" onClick={onPop} disabled={cost.length === 0}>
        1つ消す
      </button>
    </div>
    <div className="energy-buttons">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          className={`energy-button energy-${t}`}
          title={`${ENERGY_LABELS[t]}エネルギーを追加`}
          aria-label={`${ENERGY_LABELS[t]}エネルギーを追加`}
          onClick={() => onAdd(t)}
          disabled={cost.length >= MAX_COST}
        />
      ))}
    </div>
  </div>
);
