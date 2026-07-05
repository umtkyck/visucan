import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { withAuth } from '@/lib/auth';
import { CARRIERS, CarrierApiError, detectCarrier, trackShipment } from '@/lib/shipping';

const trackQuerySchema = z.object({
  number: z.string().trim().min(6, 'Tracking number is too short').max(40),
  carrier: z.enum(CARRIERS).optional(),
});

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    const query = trackQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams)
    );

    if (!query.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid tracking request', {
          errors: query.error.errors,
        }),
        { status: 400 }
      );
    }

    const { number } = query.data;
    const carrier = query.data.carrier ?? detectCarrier(number);

    if (!carrier) {
      return NextResponse.json(
        createErrorResponse(
          'UNKNOWN_CARRIER',
          'Could not detect the carrier from the tracking number. Specify ?carrier=ups|fedex|usps.'
        ),
        { status: 400 }
      );
    }

    try {
      const result = await trackShipment(carrier, number);
      return NextResponse.json(createSuccessResponse(result));
    } catch (error) {
      if (error instanceof CarrierApiError) {
        const status = error.statusCode === 404 ? 404 : 502;
        return NextResponse.json(
          createErrorResponse(
            status === 404 ? 'TRACKING_NOT_FOUND' : 'CARRIER_ERROR',
            status === 404
              ? 'No shipment found for this tracking number'
              : `The ${carrier.toUpperCase()} tracking service returned an error`
          ),
          { status }
        );
      }
      console.error('Tracking error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch tracking information'),
        { status: 500 }
      );
    }
  });
}
