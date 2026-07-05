// USPS Tracking API adapter (USPS APIs platform, OAuth 2.0 + Tracking v3).
// Docs: https://developer.usps.com/trackingv3

import { CarrierApiError } from './types';
import type { ShipmentStatus, TrackingEvent, TrackingResult } from './types';

const BASE_URL = process.env.USPS_API_URL ?? 'https://apis.usps.com';

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isUspsConfigured(): boolean {
  return Boolean(process.env.USPS_CLIENT_ID && process.env.USPS_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(`${BASE_URL}/oauth2/v3/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.USPS_CLIENT_ID,
      client_secret: process.env.USPS_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new CarrierApiError('usps', `OAuth failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

// USPS status category -> normalized status
function mapUspsStatus(category?: string, statusText?: string): ShipmentStatus {
  const value = `${category ?? ''} ${statusText ?? ''}`.toLowerCase();
  if (value.includes('delivered')) return 'delivered';
  if (value.includes('out for delivery')) return 'out_for_delivery';
  if (value.includes('in transit') || value.includes('moving')) return 'in_transit';
  if (value.includes('accept') || value.includes('picked up')) return 'picked_up';
  if (value.includes('pre-shipment') || value.includes('label')) return 'label_created';
  if (value.includes('alert') || value.includes('return')) return 'exception';
  return 'unknown';
}

interface UspsTrackingEvent {
  eventType?: string;
  eventTimestamp?: string;
  eventCity?: string;
  eventState?: string;
  eventCountry?: string;
}

function formatLocation(event: UspsTrackingEvent): string | null {
  return (
    [event.eventCity, event.eventState, event.eventCountry].filter(Boolean).join(', ') || null
  );
}

export async function trackWithUsps(trackingNumber: string): Promise<TrackingResult> {
  const token = await getAccessToken();

  const response = await fetch(
    `${BASE_URL}/tracking/v3/tracking/${encodeURIComponent(trackingNumber)}?expand=DETAIL`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new CarrierApiError('usps', `Tracking API failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as {
    statusCategory?: string;
    status?: string;
    statusSummary?: string;
    expectedDeliveryTimestamp?: string;
    trackingEvents?: UspsTrackingEvent[];
  };

  const events: TrackingEvent[] = (data.trackingEvents ?? []).map((event) => ({
    status: mapUspsStatus(undefined, event.eventType),
    description: event.eventType ?? 'Status update',
    location: formatLocation(event),
    timestamp: event.eventTimestamp ?? new Date().toISOString(),
  }));

  const status = mapUspsStatus(data.statusCategory, data.status);
  const delivered = events.find((e) => e.status === 'delivered');

  return {
    carrier: 'usps',
    carrierName: 'USPS',
    trackingNumber,
    status,
    statusDescription: data.statusSummary ?? data.status ?? 'No tracking information available',
    estimatedDelivery: data.expectedDeliveryTimestamp ?? null,
    deliveredAt: delivered?.timestamp ?? null,
    events,
    live: true,
  };
}
