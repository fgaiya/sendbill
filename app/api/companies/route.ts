import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { apiErrors, companySchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const body = await request.json();
    const validatedData = companySchemas.create.parse(body);

    const existingCompany = await prisma.company.findUnique({
      where: { userId },
    });

    if (existingCompany) {
      return NextResponse.json(
        apiErrors.conflict('会社情報は既に登録されています'),
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        ...validatedData,
        userId,
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return NextResponse.json(apiErrors.notFound('会社情報'), { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Company fetch error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}
