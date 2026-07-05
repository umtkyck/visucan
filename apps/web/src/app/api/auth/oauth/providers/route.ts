import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@visucan/utils';
import { getProviderStatuses } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(createSuccessResponse({ providers: getProviderStatuses() }));
}
