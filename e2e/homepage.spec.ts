import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('@smoke ページが正しく表示されること', async ({ page }) => {
    await page.goto('/');

    // ページタイトルが正しく設定されていることを確認
    await expect(page).toHaveTitle('SendBill - 請求書管理をシンプルに');

    // メイン要素が表示されていることを確認
    await expect(page.locator('main')).toBeVisible();

    // h1要素の内容確認
    await expect(page.locator('h1')).toContainText('請求書管理を');
    await expect(page.locator('h1')).toContainText('シンプルに');
  });

  test('ヘッダーが表示されること', async ({ page }) => {
    await page.goto('/');

    // ヘッダーが存在することを確認
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('フッターが表示されること', async ({ page }) => {
    await page.goto('/');

    // フッターが存在することを確認
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('レスポンシブデザインが機能すること', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // メインコンテンツが表示されることを確認
    await expect(page.locator('main')).toBeVisible();

    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });

    // モバイルでもメインコンテンツが表示されることを確認
    await expect(page.locator('main')).toBeVisible();
  });

  test('基本的なアクセシビリティ要件を満たすこと', async ({ page }) => {
    await page.goto('/');

    // ページにメインランドマークがあることを確認
    await expect(page.locator('main')).toBeVisible();

    // 見出し構造が適切であることを確認（h1が存在）
    const h1Elements = page.locator('h1');
    await expect(h1Elements.first()).toBeVisible();
  });
});
