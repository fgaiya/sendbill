import { NextRequest, NextResponse } from 'next/server';

import { Webhook } from 'svix';

import { prisma } from '@/lib/shared/prisma';

// Clerkウェブフックイベントの型定義
interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: ClerkUserData;
}

interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id: string;
}

export async function POST(request: NextRequest) {
  try {
    // Clerkのウェブフック署名検証
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // リクエストヘッダーとボディを取得
    const headerPayload = request.headers;
    const payload = await request.text();

    // svixを使用して署名を検証
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: ClerkWebhookEvent;

    try {
      const svixId = headerPayload.get('svix-id');
      const svixTimestamp = headerPayload.get('svix-timestamp');
      const svixSignature = headerPayload.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing required webhook headers');
        return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
      }

      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // イベントタイプによる処理分岐
    const { type, data } = evt;

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;

      case 'user.updated':
        await handleUserUpdated(data);
        break;

      case 'user.deleted':
        await handleUserDeleted(data);
        break;

      default:
        console.log('Unhandled webhook event type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ユーザー作成処理
async function handleUserCreated(data: ClerkUserData) {
  try {
    const primaryEmail = data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      console.error('Primary email not found for user:', data.id);
      return;
    }

    // upsertを使用して冪等性を確保
    await prisma.user.upsert({
      where: { clerkId: data.id },
      update: { email: primaryEmail },
      create: {
        clerkId: data.id,
        email: primaryEmail,
      },
    });

    console.log('User created successfully:', data.id);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}

// ユーザー更新処理
async function handleUserUpdated(data: ClerkUserData) {
  try {
    const primaryEmail = data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      console.error('Primary email not found for user update:', data.id);
      return;
    }

    // upsertを使用してユーザーが存在しない場合も対応
    await prisma.user.upsert({
      where: { clerkId: data.id },
      update: { email: primaryEmail },
      create: {
        clerkId: data.id,
        email: primaryEmail,
      },
    });

    console.log('User updated successfully:', data.id);
  } catch (error) {
    console.error('Failed to update user:', error);
  }
}

// ユーザー削除処理
async function handleUserDeleted(data: ClerkUserData) {
  try {
    // 冪等性を確保するため、存在チェック後削除
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: data.id },
    });

    if (existingUser) {
      await prisma.user.delete({
        where: { clerkId: data.id },
      });
      console.log('User deleted successfully:', data.id);
    } else {
      console.log('User not found, already deleted:', data.id);
    }
  } catch (error) {
    console.error('Failed to delete user:', error);
  }
}
