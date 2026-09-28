import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const canvasData = (page: Page) =>
  page.getByTestId('card-canvas').evaluate((c) => (c as HTMLCanvasElement).toDataURL());

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // 最初の描画を待つ
  await expect.poll(() => canvasData(page)).not.toBe('');
  expect(errors).toEqual([]);
});

test('入力するとプレビューが描き変わる', async ({ page }) => {
  await page.waitForTimeout(500);
  const before = await canvasData(page);
  await page.getByLabel('カード名').fill('ゴースト');
  await expect.poll(() => canvasData(page)).not.toBe(before);
});

test('初代では悪・鋼タイプを選べない', async ({ page }) => {
  const typePicker = page.getByRole('group', { name: 'タイプ' });
  await expect(typePicker.getByRole('radio', { name: '悪' })).toHaveCount(0);
  await page.getByLabel('シリーズ').selectOption({ label: 'ポケモンカード★neo' });
  await expect(typePicker.getByRole('radio', { name: '悪' })).toHaveCount(1);
});

test('わざを追加・削除できる', async ({ page }) => {
  await page.getByRole('tab', { name: 'わざ・効果' }).click();
  await page.getByRole('button', { name: 'わざを追加' }).click();
  await expect(page.getByRole('group', { name: 'わざ2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'わざを追加' })).toHaveCount(0);
  await page.getByRole('button', { name: 'わざ2を削除' }).click();
  await expect(page.getByRole('group', { name: 'わざ2' })).toHaveCount(0);
});

/** PNG の IHDR から幅と高さを読む */
const pngSize = (buf: Buffer) => ({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) });

test('PNG で保存できる', async ({ page }) => {
  // 日本語のファイル名は実行環境のロケールに左右されるので、ここでは英字で確かめる
  await page.getByLabel('カード名').fill('Gengar');
  for (const [label, width, height] of [
    ['400×560', 400, 560],
    ['800×1120', 800, 1120],
  ] as const) {
    await page.getByLabel('保存する画像の大きさ').selectOption({ label });
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PNG で保存' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('Gengar.png');
    expect(pngSize(await readFile(await file.path()))).toEqual({ width, height });
  }
});

test('入力内容は再読み込みしても残る', async ({ page }) => {
  await page.getByLabel('カード名').fill('ゴースト');
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByLabel('カード名')).toHaveValue('ゴースト');
});

test('ダブルクリックでカードを裏返せる', async ({ page }) => {
  const flip = page.getByTestId('card-flip');
  const button = page.getByRole('button', { name: 'うらを見る' });
  await expect(page.getByAltText('カードの裏面')).toBeAttached();

  await page.getByTestId('card-canvas').dblclick();
  await expect(flip).toHaveClass(/flipped/);
  await expect(page.getByRole('button', { name: 'おもてを見る' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // 裏面をダブルクリックすると、おもてに戻る
  await page.getByAltText('カードの裏面').dblclick();
  await expect(flip).not.toHaveClass(/flipped/);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('キラ加工をかけられる', async ({ page }) => {
  await page.getByRole('tab', { name: '画像' }).click();
  await expect(page.getByTestId('holo-shine')).toHaveCount(0);
  await page.waitForTimeout(500);
  const before = await canvasData(page);

  await page.getByLabel('模様').selectOption({ label: 'コスモ（★neo風）' });
  await expect(page.getByTestId('holo-shine')).toBeAttached();
  await expect.poll(() => canvasData(page)).not.toBe(before);

  await page.getByLabel('範囲').selectOption({ label: 'カード全体' });
  await page.getByLabel('模様').selectOption({ label: 'なし' });
  await expect(page.getByTestId('holo-shine')).toHaveCount(0);
});

test('e シリーズだけポケパワー・ポケボディーを設定できる', async ({ page }) => {
  const ability = page.getByRole('group', { name: 'ポケパワー・ポケボディー' });
  await page.getByRole('tab', { name: 'わざ・効果' }).click();
  await expect(ability).toHaveCount(0);

  await page.getByRole('tab', { name: '基本' }).click();
  await page.getByLabel('シリーズ').selectOption({ label: 'ポケモンカードe' });
  await page.getByRole('tab', { name: 'わざ・効果' }).click();
  await expect(ability).toBeVisible();
  await page.waitForTimeout(500);
  const before = await canvasData(page);

  await ability.getByLabel('種類').selectOption({ label: 'ポケパワー' });
  await ability.getByLabel('名前').fill('エナジートランス');
  await expect.poll(() => canvasData(page)).not.toBe(before);

  await page.getByRole('tab', { name: '基本' }).click();
  await page.getByLabel('カードの種類').selectOption({ label: 'トレーナー' });
  await page.getByRole('tab', { name: 'わざ・効果' }).click();
  await expect(ability).toHaveCount(0);
});

test('レイアウト確認モードで枠と座標を表示できる', async ({ page }) => {
  const guides = page.getByTestId('layout-guides');
  await expect(guides).toHaveCount(0);
  await page.waitForTimeout(500);
  const before = await canvasData(page);

  await page.getByLabel('レイアウト確認').check();
  await expect(guides).toBeVisible();
  await expect(guides.getByText('わざ欄')).toBeAttached();
  // 枠は重ねて表示するだけで、カードの画像（PNG）には入らない
  expect(await canvasData(page)).toBe(before);

  const box = await page.getByTestId('card-canvas').boundingBox();
  if (!box) throw new Error('canvas が見つかりません');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByText(/カード座標 x: (199|200|201) \/ y: (279|280|281)/)).toBeVisible();

  // 次に開いたときも確認モードのまま
  await page.reload();
  await expect(guides).toBeVisible();
  await page.getByLabel('レイアウト確認').uncheck();
  await expect(guides).toHaveCount(0);
});
