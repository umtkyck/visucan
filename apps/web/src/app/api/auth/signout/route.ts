import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@visucan/utils';
import { clearAuthCookies } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json(
    createSuccessResponse({ message: 'Signed out successfully' })
  );

  clearAuthCookies(response);

  return response;
}
