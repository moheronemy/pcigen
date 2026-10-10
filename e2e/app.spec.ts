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

test('e シリーズでポケパワー・ポケボディーを設定できる', async ({ page }) => {
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

test('PCG の ex・特性の設定を保存し、他のシリーズでは ex を表示しない', async ({ page }) => {
  await page.getByLabel('シリーズ').selectOption('pcg');
  await expect(page.getByLabel('LV', { exact: true })).toHaveCount(0);
  await page.getByLabel('カード名').fill('ラティオス');
  await page.getByLabel('HP', { exact: true }).fill('100');
  await page.getByLabel('ポケモンex', { exact: true }).check();
  await page.getByLabel('レイアウト確認').check();
  await expect(page.getByTestId('layout-guides').getByText('ポケモンexのルール')).toBeVisible();

  await page.getByRole('tab', { name: 'わざ・効果' }).click();
  const ability = page.getByRole('group', { name: 'ポケパワー・ポケボディー' });
  await ability.getByLabel('種類').selectOption('pokebody');
  await ability.getByLabel('名前', { exact: true }).fill('クリアボディー');
  await ability.getByLabel('説明').fill('このポケモンは特殊状態にならない。');
  await expect(page.getByLabel('ずかん')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('pcigen:card:v1') ?? '{}');
        return [saved.series, saved.isEx, saved.ability?.name];
      }),
    )
    .toEqual(['pcg', true, 'クリアボディー']);
  await page.reload();
  await expect(page.getByLabel('シリーズ')).toHaveValue('pcg');
  await expect(page.getByLabel('ポケモンex', { exact: true })).toBeChecked();
  await page.getByLabel('シリーズ').selectOption('neo');
  await expect(page.getByLabel('ポケモンex', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('layout-guides').getByText('ポケモンexのルール')).toHaveCount(0);
});

test('PCG の透過窓にイラストを描き、PNG と JSON を書き出せる', async ({ page }) => {
  await page.getByLabel('シリーズ').selectOption('pcg');
  await page.getByLabel('カード名').fill('Latios');
  await page.getByLabel('ポケモンex', { exact: true }).check();
  await page.getByRole('tab', { name: '画像' }).click();
  await page
    .getByRole('group', { name: 'イラスト', exact: true })
    .locator('input[type=file]')
    .setInputFiles({
      name: 'art.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="400" height="250" fill="#1e90ff"/></svg>',
      ),
    });
  const artPixel = () =>
    page.getByTestId('card-canvas').evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      return Array.from(canvas.getContext('2d')!.getImageData(400, 300, 1, 1).data);
    });
  await expect.poll(artPixel).toEqual([30, 144, 255, 255]);
  for (const [scale, width, height] of [
    ['1', 400, 560],
    ['2', 800, 1120],
  ] as const) {
    await page.getByLabel('保存する画像の大きさ').selectOption(scale);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PNG で保存' }).click();
    const file = await download;
    const data = await readFile(await file.path());
    expect(pngSize(data)).toEqual({ width, height });
    const pixel = await page.evaluate(
      async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        return Array.from(ctx.getImageData(img.width / 2, (img.height * 150) / 560, 1, 1).data);
      },
      `data:image/png;base64,${data.toString('base64')}`,
    );
    expect(pixel).toEqual([30, 144, 255, 255]);
  }
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON に書き出す' }).click();
  const data = JSON.parse(await readFile(await (await download).path(), 'utf8'));
  expect(data).toMatchObject({ series: 'pcg', isEx: true, name: 'Latios' });
  await page.getByRole('tab', { name: '基本' }).click();
  await page.getByLabel('シリーズ').selectOption('base');
  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: 'card.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('tab', { name: '基本' }).click();
  await expect(page.getByLabel('シリーズ')).toHaveValue('pcg');
  await expect(page.getByLabel('ポケモンex', { exact: true })).toBeChecked();
  await expect.poll(artPixel).toEqual([30, 144, 255, 255]);
});

test('PCG の進化ポケモンとトレーナーを切り替えられる', async ({ page }) => {
  await page.getByLabel('シリーズ').selectOption('pcg');
  await page.getByLabel('カードの種類').selectOption('stage1');
  await page.getByLabel('進化元').fill('ゴース');
  await page.getByLabel('レイアウト確認').check();
  await expect(
    page.getByTestId('layout-guides').getByText('進化元', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: '画像' }).click();
  await expect(page.getByRole('group', { name: '進化前のポケモン' })).toHaveCount(0);
  await page.getByRole('tab', { name: '基本' }).click();
  await page.getByLabel('カードの種類').selectOption('trainer');
  await expect(page.getByLabel('ポケモンex', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'わざ・効果' }).click();
  await page
    .getByLabel('効果', { exact: true })
    .fill('自分のポケモン1匹のダメージカウンターを2個とる。');
  await expect(page.getByRole('group', { name: 'ポケパワー・ポケボディー' })).toHaveCount(0);
  await expect(page.getByTestId('layout-guides').getByText('効果', { exact: true })).toBeVisible();
  await expect(page.getByTestId('layout-guides').getByText('わざ欄')).toHaveCount(0);
});

test('PCG の9タイプで枠が変わり、ex のときだけルール枠を重ねる', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const canvas = page.getByTestId('card-canvas');
  const pixel = (x: number, y: number) =>
    canvas.evaluate(
      (el, { x, y }) => {
        const c = el as HTMLCanvasElement;
        return Array.from(c.getContext('2d')!.getImageData(x * 2, y * 2, 1, 1).data);
      },
      { x, y },
    );
  await expect.poll(() => pixel(100, 24)).not.toEqual([0, 0, 0, 0]);
  const originalHeader = await pixel(100, 24);
  await page.getByLabel('シリーズ').selectOption('pcg');
  await expect.poll(() => pixel(100, 24)).not.toEqual(originalHeader);
  const headers: string[] = [];
  for (const type of ['無', '草', '炎', '水', '雷', '超', '闘', '悪', '鋼']) {
    const previous = headers.at(-1);
    await page
      .getByRole('group', { name: 'タイプ', exact: true })
      .getByTitle(type, { exact: true })
      .click();
    if (previous)
      await expect.poll(async () => JSON.stringify(await pixel(100, 24))).not.toBe(previous);
    headers.push(JSON.stringify(await pixel(100, 24)));
    await expect(page.locator('.preview .error')).toHaveCount(0);
  }
  expect(new Set(headers).size).toBe(9);
  const panel = await pixel(290, 288);
  const outside = await pixel(50, 310);
  await page.getByLabel('ポケモンex', { exact: true }).check();
  await expect.poll(() => pixel(290, 288)).not.toEqual(panel);
  expect(await pixel(50, 310)).toEqual(outside);
  await page.getByLabel('ポケモンex', { exact: true }).uncheck();
  await expect.poll(() => pixel(290, 288)).toEqual(panel);
  expect(errors).toEqual([]);
});
