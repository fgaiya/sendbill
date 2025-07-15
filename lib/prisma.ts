declare global {
  var prisma: PrismaClient | undefined
}

import { PrismaClient } from '@prisma/client'

// グローバルキャッシュを利用（開発環境での接続数増殖防止）
export const prisma = globalThis.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// プロセス終了時に接続を明示的に切断（CIやテスト環境でのリーク防止）
const disconnect = async () => {
  await prisma.$disconnect()
}

process.on('beforeExit', disconnect)
process.on('SIGINT', disconnect) 
process.on('SIGTERM', disconnect)