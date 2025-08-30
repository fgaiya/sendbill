import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@prisma/client/edge';

import { companySchemas, apiErrors, handleApiError } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { requireAuth } from '@/lib/shared/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const { user, error, status } = await requireAuth();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = companySchemas.create.parse(body);

    // 直接作成を試行し、一意制約違反をキャッチ（TOCTOU問題を回避）
    try {
      const company = await getPrisma().company.create({
        data: { ...validatedData, userId: user!.id },
      });
      return NextResponse.json(company, { status: 201 });
    } catch (e: unknown) {
      // 一意制約違反（並行リクエストによる重複作成）をキャッチ
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return NextResponse.json(
          apiErrors.conflict('会社情報は既に登録されています'),
          { status: 409 }
        );
      }
      throw e;
    }
  } catch (error) {
    return handleApiError(error, '会社情報 creation');
  }
}

export async function GET() {
  try {
    const { user, error, status } = await requireAuth();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const company = await getPrisma().company.findUnique({
      where: { userId: user!.id },
    });

    if (!company) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json([company]);
  } catch (error) {
    return handleApiError(error, '会社情報 fetch');
  }
}
