import { useId, useState } from 'react';
import type { Artwork } from '../model/card';
import { MAX_ART_SCALE, MIN_ART_SCALE } from '../state/cardReducer';
import { readFileAsDataUrl } from '../state/storage';

interface Props {
  label: string;
  art: Artwork;
  onChange: (patch: Partial<Artwork>) => void;
  onClear: () => void;
  hint?: string;
}

export const ImageInput = ({ label, art, onChange, onClear, hint }: Props) => {
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選んでください');
      return;
    }
    setError(null);
    try {
      onChange({ src: await readFileAsDataUrl(file), x: 0, y: 0, scale: 1 });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <fieldset className="image-input">
      <legend>{label}</legend>
      <input
        id={id}
        type="file"
        accept="image/*"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {hint && <p className="muted">{hint}</p>}
      {error && <p className="error">{error}</p>}
      {art.src && (
        <div className="image-controls">
          <label className="field">
            <span className="field-label">拡大率 {Math.round(art.scale * 100)}%</span>
            <input
              type="range"
              min={MIN_ART_SCALE}
              max={MAX_ART_SCALE}
              step={0.01}
              value={art.scale}
              onChange={(e) => onChange({ scale: Number(e.target.value) })}
            />
          </label>
          <div className="row">
            <button
              type="button"
              className="small"
              onClick={() => onChange({ x: 0, y: 0, scale: 1 })}
            >
              位置を戻す
            </button>
            <button type="button" className="small danger" onClick={onClear}>
              画像を外す
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
};
