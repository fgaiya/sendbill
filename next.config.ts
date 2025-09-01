import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
const isJest = !!process.env.JEST_WORKER_ID;

const nextConfig: NextConfig = {
  /* config options here */
};

// 非同期IIFEで動的import（requireは使わない）
export default (async () => {
  if (isDev && !isJest) {
    const mod = (await import(
      '@opennextjs/cloudflare'
    )) as typeof import('@opennextjs/cloudflare');
    mod.initOpenNextCloudflareForDev();
  }
  return nextConfig;
})();
