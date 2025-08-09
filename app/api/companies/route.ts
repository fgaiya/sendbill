import { NextRequest, NextResponse } from 'next/server';

import { companySchemas, apiErrors, handleApiError } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { requireAuth } from '@/lib/shared/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const { user, error, status } = await requireAuth();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 既存の会社情報チェック
    const existingCompany = await prisma.company.findUnique({
      where: { userId: user!.id },
    });

    if (existingCompany) {
      return NextResponse.json(
        apiErrors.conflict('会社情報は既に登録されています'),
        { status: 409 }
      );
    }

    const body = await request.json();
    const validatedData = companySchemas.create.parse(body);

    const company = await prisma.company.create({
      data: { ...validatedData, userId: user!.id },
    });

    return NextResponse.json(company, { status: 201 });
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

    const company = await prisma.company.findUnique({
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
