// FedEx Track API adapter (OAuth 2.0 client-credentials + Track API v1).
// Docs: https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html

import { CarrierApiError } from './types';
import type { ShipmentStatus, TrackingEvent, TrackingResult } from './types';

const BASE_URL = process.env.FEDEX_API_URL ?? 'https://apis.fedex.com';

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isFedexConfigured(): boolean {
  return Boolean(process.env.FEDEX_CLIENT_ID && process.env.FEDEX_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FEDEX_CLIENT_ID!,
      client_secret: process.env.FEDEX_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new CarrierApiError('fedex', `OAuth failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

// FedEx derivedCode -> normalized status
const FEDEX_STATUS_MAP: Record<string, ShipmentStatus> = {
  IN: 'label_created', // initiated
  PU: 'picked_up',
  IT: 'in_transit',
  AR: 'in_transit', // arrived at facility
  DP: 'in_transit', // departed facility
  OD: 'out_for_delivery',
  DL: 'delivered',
  DE: 'exception',
  CA: 'exception', // cancelled
  RS: 'exception', // return to shipper
};

interface FedexScanEvent {
  derivedStatusCode?: string;
  eventDescription?: string;
  date?: string;
  scanLocation?: { city?: string; stateOrProvinceCode?: string; countryCode?: string };
}

function formatLocation(event: FedexScanEvent): string | null {
  const loc = event.scanLocation;
  if (!loc) return null;
  return [loc.city, loc.stateOrProvinceCode, loc.countryCode].filter(Boolean).join(', ') || null;
}

export async function trackWithFedex(trackingNumber: string): Promise<TrackingResult> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/track/v1/trackingnumbers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeDetailedScans: true,
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
    }),
  });

  if (!response.ok) {
    throw new CarrierApiError('fedex', `Track API failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as {
    output?: {
      completeTrackResults?: Array<{
        trackResults?: Array<{
          latestStatusDetail?: { derivedCode?: string; description?: string };
          dateAndTimes?: Array<{ type: string; dateTime: string }>;
          scanEvents?: FedexScanEvent[];
        }>;
      }>;
    };
  };

  const result = data.output?.completeTrackResults?.[0]?.trackResults?.[0];
  if (!result) {
    throw new CarrierApiError('fedex', 'No tracking data returned');
  }

  const events: TrackingEvent[] = (result.scanEvents ?? []).map((event) => ({
    status: FEDEX_STATUS_MAP[event.derivedStatusCode ?? ''] ?? 'unknown',
    description: event.eventDescription ?? 'Status update',
    location: formatLocation(event),
    timestamp: event.date ?? new Date().toISOString(),
  }));

  const latestCode = result.latestStatusDetail?.derivedCode ?? '';
  const estimated = result.dateAndTimes?.find((d) => d.type === 'ESTIMATED_DELIVERY');
  const delivered = result.dateAndTimes?.find((d) => d.type === 'ACTUAL_DELIVERY');

  return {
    carrier: 'fedex',
    carrierName: 'FedEx',
    trackingNumber,
    status: FEDEX_STATUS_MAP[latestCode] ?? 'unknown',
    statusDescription:
      result.latestStatusDetail?.description ?? 'No tracking information available',
    estimatedDelivery: estimated?.dateTime ?? null,
    deliveredAt: delivered?.dateTime ?? null,
    events,
    live: true,
  };
}
