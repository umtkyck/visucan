import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@visucan/utils';
import { withAuth } from '@/lib/auth';
import { getCarriers } from '@/lib/shipping';

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const carriers = getCarriers().map((carrier) => ({
      id: carrier.id,
      name: carrier.name,
      country: carrier.country,
      configured: carrier.configured,
    }));

    return NextResponse.json(createSuccessResponse({ carriers }));
  });
}
