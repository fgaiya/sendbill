import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// Workersではグローバルに使い回さず、毎リクエスト生成が基本
export function getPrisma() {
  return new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL! }, // 後で prisma:// に切り替える
    },
  }).$extends(withAccelerate());
}
