import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // ISR を R2 に載せる場合は後で incrementalCache を設定
});
