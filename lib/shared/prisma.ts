declare global {
  var prisma: PrismaClient | undefined
  var __prisma_disconnect_hook__: boolean | undefined
}

import { PrismaClient } from '@prisma/client'

// グローバルキャッシュを利用（開発環境での接続数増殖防止）
export const prisma = globalThis.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// プロセス終了時に接続を明示的に切断（CIやテスト環境でのリーク防止）
const disconnect = async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Prisma disconnect error:', error)
  }
}

// 多重登録防止フラグ
if (!globalThis.__prisma_disconnect_hook__) {
  globalThis.__prisma_disconnect_hook__ = true

process.on('beforeExit', disconnect)
process.on('SIGINT', disconnect) 
process.on('SIGTERM', disconnect)
}