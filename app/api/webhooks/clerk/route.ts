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
      evt = wh.verify(payload, {
        'svix-id': headerPayload.get('svix-id')!,
        'svix-timestamp': headerPayload.get('svix-timestamp')!,
        'svix-signature': headerPayload.get('svix-signature')!,
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

    await prisma.user.create({
      data: {
        clerkId: data.id,
        email: primaryEmail,
      },
    });

    console.log('User created successfully:', data.id);
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
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

    await prisma.user.update({
      where: { clerkId: data.id },
      data: {
        email: primaryEmail,
      },
    });

    console.log('User updated successfully:', data.id);
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

// ユーザー削除処理
async function handleUserDeleted(data: ClerkUserData) {
  try {
    await prisma.user.delete({
      where: { clerkId: data.id },
    });

    console.log('User deleted successfully:', data.id);
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}
