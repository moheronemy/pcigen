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
