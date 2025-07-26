import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { apiErrors, companySchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { requireAuth } from '@/lib/shared/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const { user, error, status } = await requireAuth();

    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = companySchemas.create.parse(body);

    const existingCompany = await prisma.company.findUnique({
      where: { userId: user!.id },
    });

    if (existingCompany) {
      return NextResponse.json(
        apiErrors.conflict('会社情報は既に登録されています'),
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        ...validatedData,
        userId: user!.id,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(apiErrors.validation(error.issues), {
        status: 400,
      });
    }

    console.error('Company creation error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}

export async function GET() {
  try {
    const { user, error, status } = await requireAuth();

    if (error) {
      return NextResponse.json(error, { status });
    }

    const companies = await prisma.company.findMany({
      where: { userId: user!.id },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Company fetch error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}
