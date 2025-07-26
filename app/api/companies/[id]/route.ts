import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { apiErrors, companySchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { requireAuth } from '@/lib/shared/utils/auth';
import { omitUndefined } from '@/lib/shared/utils/objects';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { user, error, status } = await requireAuth();

    if (error) {
      return NextResponse.json(error, { status });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = companySchemas.update.parse(body);

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(apiErrors.notFound('会社情報'), { status: 404 });
    }

    if (existingCompany.userId !== user!.id) {
      return NextResponse.json(apiErrors.forbidden(), { status: 403 });
    }

    const filteredData = omitUndefined(validatedData);

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
    const { user, error, status } = await requireAuth();

    if (error) {
      return NextResponse.json(error, { status });
    }

    const { id } = await context.params;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(apiErrors.notFound('会社情報'), { status: 404 });
    }

    if (existingCompany.userId !== user!.id) {
      return NextResponse.json(apiErrors.forbidden(), { status: 403 });
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
