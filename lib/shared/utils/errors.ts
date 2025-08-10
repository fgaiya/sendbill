export class NotFoundError extends Error {
  constructor(message = 'リソースが見つかりません') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message = '更新競合が発生しました') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'アクセス権限がありません') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = '認証が必要です') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
