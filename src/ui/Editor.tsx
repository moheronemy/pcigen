import { useState, type Dispatch } from 'react';
import { POKEMON_NAMES } from '../data/pokemonNames';
import {
  ABILITY_KINDS,
  ABILITY_LABELS,
  availableTypes,
  HOLO_AREA_LABELS,
  HOLO_AREAS,
  HOLO_STYLE_LABELS,
  HOLO_STYLES,
  MAX_MOVES,
  MAX_RETREAT,
  RARITIES,
  SERIES,
  SERIES_LABELS,
  STAGE_LABELS,
  STAGES,
  supportsAbility,
  type CardData,
} from '../model/card';
import type { CardAction } from '../state/cardReducer';
import { EnergyCostEditor } from './EnergyCostEditor';
import { ImageInput } from './ImageInput';
import { Select, TextArea, TextField } from './fields';
import { TypePicker } from './TypePicker';

const TABS = [
  { id: 'basic', label: '基本' },
  { id: 'moves', label: 'わざ・効果' },
  { id: 'detail', label: '詳細' },
  { id: 'images', label: '画像' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const NAMES_LIST_ID = 'pokemon-names';

interface Props {
  card: CardData;
  dispatch: Dispatch<CardAction>;
}

export const Editor = ({ card, dispatch }: Props) => {
  const [tab, setTab] = useState<TabId>('basic');
  const set = (patch: Partial<CardData>) => dispatch({ type: 'set', patch });
  const types = availableTypes(card.series);
  const isTrainer = card.stage === 'trainer';
  const evolved = card.stage === 'stage1' || card.stage === 'stage2';

  return (
    <div className="editor">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={`tab tab-${t.id}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <datalist id={NAMES_LIST_ID}>
        {POKEMON_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div
        className={`panel panel-${tab}`}
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === 'basic' && (
          <>
            <div className="grid-2">
              <Select
                label="シリーズ"
                value={card.series}
                options={SERIES.map((s) => ({ value: s, label: SERIES_LABELS[s] }))}
                onChange={(series) => set({ series })}
              />
              <Select
                label="カードの種類"
                value={card.stage}
                options={STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
                onChange={(stage) => set({ stage })}
              />
            </div>
            <TextField
              label="カード名"
              value={card.name}
              onChange={(name) => set({ name })}
              placeholder={isTrainer ? 'きずぐすり' : 'わるいゴースト'}
              list={isTrainer ? undefined : NAMES_LIST_ID}
            />
            {!isTrainer && (
              <>
                <div className="grid-3">
                  <TextField
                    label="HP"
                    value={card.hp}
                    onChange={(hp) => set({ hp })}
                    placeholder="50"
                    inputMode="numeric"
                  />
                  <TextField
                    label="LV"
                    value={card.level}
                    onChange={(level) => set({ level })}
                    placeholder="12"
                    inputMode="numeric"
                  />
                  {evolved && (
                    <TextField
                      label="進化元"
                      value={card.evolvesFrom}
                      onChange={(evolvesFrom) => set({ evolvesFrom })}
                      placeholder="ゴース"
                      list={NAMES_LIST_ID}
                    />
                  )}
                </div>
                <TypePicker
                  label="タイプ"
                  value={card.type}
                  types={types}
                  onChange={(type) => type && set({ type })}
                />
              </>
            )}
          </>
        )}

        {tab === 'moves' && isTrainer && (
          <TextArea
            label="効果"
            rows={8}
            value={card.trainerText}
            onChange={(trainerText) => set({ trainerText })}
            placeholder="自分のポケモン1匹のダメージカウンターを2個とる。"
          />
        )}

        {tab === 'moves' && !isTrainer && (
          <>
            {supportsAbility(card) && (
              <fieldset className="ability">
                <legend>ポケパワー・ポケボディー</legend>
                <Select
                  label="種類"
                  value={card.ability.kind}
                  options={ABILITY_KINDS.map((k) => ({ value: k, label: ABILITY_LABELS[k] }))}
                  onChange={(kind) => dispatch({ type: 'setAbility', patch: { kind } })}
                />
                {card.ability.kind !== 'none' && (
                  <>
                    <TextField
                      label="名前"
                      value={card.ability.name}
                      onChange={(name) => dispatch({ type: 'setAbility', patch: { name } })}
                      placeholder={
                        card.ability.kind === 'pokepower' ? 'エナジートランス' : 'あついからだ'
                      }
                    />
                    <TextArea
                      label="説明"
                      value={card.ability.text}
                      onChange={(text) => dispatch({ type: 'setAbility', patch: { text } })}
                    />
                  </>
                )}
              </fieldset>
            )}
            {card.moves.map((move, i) => (
              <fieldset key={i} className="move">
                <legend>わざ{i + 1}</legend>
                <div className="grid-name-damage">
                  <TextField
                    label="名前"
                    value={move.name}
                    onChange={(name) => dispatch({ type: 'setMove', index: i, patch: { name } })}
                    placeholder="たいあたり"
                  />
                  <TextField
                    label="ダメージ"
                    value={move.damage}
                    onChange={(damage) =>
                      dispatch({ type: 'setMove', index: i, patch: { damage } })
                    }
                    placeholder="10"
                  />
                </div>
                <TextArea
                  label="説明"
                  value={move.text}
                  onChange={(text) => dispatch({ type: 'setMove', index: i, patch: { text } })}
                />
                <EnergyCostEditor
                  cost={move.cost}
                  types={types}
                  onAdd={(energy) => dispatch({ type: 'addCost', index: i, energy })}
                  onPop={() => dispatch({ type: 'popCost', index: i })}
                />
                {card.moves.length > 1 && (
                  <button
                    type="button"
                    className="small danger"
                    onClick={() => dispatch({ type: 'removeMove', index: i })}
                  >
                    わざ{i + 1}を削除
                  </button>
                )}
              </fieldset>
            ))}
            {card.moves.length < MAX_MOVES && (
              <button type="button" onClick={() => dispatch({ type: 'addMove' })}>
                わざを追加
              </button>
            )}

            <TypePicker
              label="弱点"
              value={card.weakness}
              types={types}
              allowNone
              onChange={(weakness) => set({ weakness })}
            />
            <TypePicker
              label="抵抗力"
              value={card.resistance}
              types={types}
              allowNone
              onChange={(resistance) => set({ resistance })}
            />
            {card.resistance && (
              <TextField
                label="抵抗力のダメージ"
                className="short"
                value={card.resistanceValue}
                onChange={(resistanceValue) => set({ resistanceValue })}
              />
            )}
            <Select
              label="にげる"
              value={card.retreat}
              options={Array.from({ length: MAX_RETREAT + 1 }, (_, n) => ({
                value: n,
                label: n === 0 ? 'なし' : `${n}個`,
              }))}
              onChange={(retreat) => set({ retreat })}
            />
            <TextArea
              label="ずかん"
              value={card.pokedex}
              onChange={(pokedex) => set({ pokedex })}
              placeholder="ポケモン図鑑の説明文"
            />
          </>
        )}

        {tab === 'detail' && (
          <>
            {!isTrainer && (
              <TextField
                label="種類・たかさ・おもさ"
                value={card.info}
                onChange={(info) => set({ info })}
                placeholder="ガスじょうポケモン　たかさ1.3m　おもさ0.1kg"
              />
            )}
            <TextField
              label="イラストレーター"
              value={card.illustrator}
              onChange={(illustrator) => set({ illustrator })}
            />
            <TextField
              label="著作権表示"
              value={card.copyright}
              onChange={(copyright) => set({ copyright })}
            />
            <div className="grid-2">
              <TextField
                label="ナンバリング"
                value={card.number}
                onChange={(number) => set({ number })}
                placeholder="No.094"
              />
              <Select
                label="レアリティ"
                value={card.rarity}
                options={RARITIES.map((r) => ({ value: r, label: r || 'なし' }))}
                onChange={(rarity) => set({ rarity })}
              />
            </div>
          </>
        )}

        {tab === 'images' && (
          <>
            <ImageInput
              label="イラスト"
              art={card.art}
              hint="プレビュー上でドラッグすると位置、ホイールで拡大率を変えられます。"
              onChange={(patch) => dispatch({ type: 'setArt', key: 'art', patch })}
              onClear={() => dispatch({ type: 'clearArt', key: 'art' })}
            />
            <fieldset className="holo-input">
              <legend>キラ加工</legend>
              <div className="grid-2">
                <Select
                  label="模様"
                  value={card.holo.style}
                  options={HOLO_STYLES.map((v) => ({ value: v, label: HOLO_STYLE_LABELS[v] }))}
                  onChange={(style) => dispatch({ type: 'setHolo', patch: { style } })}
                />
                {card.holo.style !== 'none' && (
                  <Select
                    label="範囲"
                    value={card.holo.area}
                    options={HOLO_AREAS.map((v) => ({ value: v, label: HOLO_AREA_LABELS[v] }))}
                    onChange={(area) => dispatch({ type: 'setHolo', patch: { area } })}
                  />
                )}
              </div>
              {card.holo.style !== 'none' && (
                <>
                  <label className="field">
                    <span className="field-label">
                      強さ {Math.round(card.holo.intensity * 100)}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={card.holo.intensity}
                      onChange={(e) =>
                        dispatch({
                          type: 'setHolo',
                          patch: { intensity: Number(e.target.value) },
                        })
                      }
                    />
                  </label>
                  <p className="muted">
                    プレビューにマウスを乗せると、傾きに合わせて光り方が変わります。保存する PNG
                    には止まった状態の模様が入ります。
                  </p>
                </>
              )}
            </fieldset>
            {evolved && (
              <ImageInput
                label="進化前のポケモン"
                art={card.evoArt}
                onChange={(patch) => dispatch({ type: 'setArt', key: 'evoArt', patch })}
                onClear={() => dispatch({ type: 'clearArt', key: 'evoArt' })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
