import {
  defineConfig,
  devices,
  type ReporterDescription,
} from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const isCI = !!process.env.CI;
const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
// ローカル開発時に軽量テストを行うモード。何も指定しなければ "local"。
const mode = process.env.E2E_MODE || 'local';
const isLocal = !isCI && mode === 'local';

// Reporter を型安全に構築
const reporters: ReporterDescription[] = [];
if (isPR || isLocal) {
  // PR／ローカルは軽量 dot
  reporters.push(['dot']);
} else {
  // CI main は list + GitHub Actions + HTML
  reporters.push(['list']);
  if (isCI) {
    reporters.push(['github']);
    reporters.push(['html', { outputFolder: 'playwright-report' }]);
  }
}

export default defineConfig({
  testDir: './e2e',

  fullyParallel: true,
  // PR／ローカルは 1 worker、CI main は 2 workers
  workers: isPR || isLocal ? 1 : isCI ? 2 : undefined,

  forbidOnly: isCI,
  // リトライ: PR/ローカル=0、CI main=2
  retries: isPR || isLocal ? 0 : isCI ? 2 : 0,

  reporter: reporters,

  use: {
    baseURL,
    // ローカル／PR は高速化モード、本番品質(CI main)のみトレース/スクショ/動画
    trace: isPR || isLocal ? 'off' : 'on-first-retry',
    screenshot: isPR || isLocal ? 'off' : 'only-on-failure',
    video: isPR || isLocal ? 'off' : 'retain-on-failure',
  },

  projects:
    isPR || isLocal
      ? [
          {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
          },
        ]
      : [
          { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
        ],

  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
