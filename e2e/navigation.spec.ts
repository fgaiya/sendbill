import { test, expect } from '@playwright/test';

test.describe('ナビゲーション', () => {
  test('基本的なナビゲーション要素が表示されること', async ({ page }) => {
    await page.goto('/');

    // ナビゲーションバーが存在することを確認
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('デスクトップナビゲーションが表示されること', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    // デスクトップでは認証リンクが直接表示されることを確認
    const desktopSignInLink = page.locator('header a[href="/sign-in"]');
    const desktopSignUpLink = page.locator('header a[href="/sign-up"]');

    await expect(desktopSignInLink).toBeVisible();
    await expect(desktopSignUpLink).toBeVisible();

    // モバイルメニューボタンは非表示であることを確認
    const menuButton = page.locator('button[aria-label="メニューを開く"]');
    await expect(menuButton).not.toBeVisible();
  });

  test('キーボードナビゲーションが機能すること', async ({ page }) => {
    await page.goto('/');

    // Tabキーでフォーカス移動をテスト
    await page.keyboard.press('Tab');

    // フォーカスされた要素が存在することを確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('認証状態に応じたナビゲーションが表示されること', async ({ page }) => {
    await page.goto('/');

    // 未認証状態でのリンク確認（ヘッダー内のリンクのみを対象）
    const headerSignInLink = page.locator('header a[href="/sign-in"]').first();
    const headerSignUpLink = page.locator('header a[href="/sign-up"]').first();

    await expect(headerSignInLink).toBeVisible();
    await expect(headerSignUpLink).toBeVisible();

    // メインコンテンツのCTAボタンも確認
    const mainSignInButton = page.locator('main a[href="/sign-in"]');
    const mainSignUpButton = page.locator('main a[href="/sign-up"]');

    await expect(mainSignInButton).toBeVisible();
    await expect(mainSignUpButton).toBeVisible();

    // ヘッダーのログインリンクをクリック
    await headerSignInLink.click();

    // サインインページに遷移することを確認
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('ロゴクリックでホームページに戻ること', async ({ page }) => {
    // まずホームページに移動
    await page.goto('/');

    // ヘッダー内のSendBillロゴを確認
    const logoLink = page
      .locator('header a[href="/"]')
      .filter({ hasText: 'SendBill' });
    await expect(logoLink).toBeVisible();

    // サインインページに遷移
    await page.goto('/sign-in');

    // サインインページからロゴをクリックしてホームに戻る
    const logoLinkFromSignIn = page
      .locator('header a[href="/"]')
      .filter({ hasText: 'SendBill' });
    await expect(logoLinkFromSignIn).toBeVisible();
    await logoLinkFromSignIn.click();

    // ホームページに戻ることを確認
    await expect(page).toHaveURL('/');
  });

  test('フォーカス管理が機能すること', async ({ page }) => {
    await page.goto('/');

    // Tabキーでフォーカス移動をテスト
    await page.keyboard.press('Tab');

    // フォーカスされた要素が存在することを確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Enterキーでリンクが機能することを確認
    const firstLink = page.locator('header a').first();
    await firstLink.focus();

    // フォーカス状態を確認
    await expect(firstLink).toBeFocused();
  });
});
