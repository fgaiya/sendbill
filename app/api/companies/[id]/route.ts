import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { apiErrors, companySchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { checkResourceOwnership } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = companySchemas.update.parse(body);

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    const ownershipError = checkResourceOwnership(
      existingCompany,
      userId,
      '会社情報'
    );
    if (ownershipError) {
      return ownershipError;
    }

    const filteredData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    ) as Partial<typeof validatedData>;

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: filteredData,
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(apiErrors.validation(error.issues), {
        status: 400,
      });
    }

    console.error('Company update error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const { id } = await context.params;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    const ownershipError = checkResourceOwnership(
      existingCompany,
      userId,
      '会社情報'
    );
    if (ownershipError) {
      return ownershipError;
    }

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: '会社情報を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Company delete error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}
