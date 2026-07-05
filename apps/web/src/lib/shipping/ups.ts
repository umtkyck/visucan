// UPS Tracking API adapter (OAuth 2.0 client-credentials + Track API v1).
// Docs: https://developer.ups.com/api/reference/tracking

import { CarrierApiError } from './types';
import type { ShipmentStatus, TrackingEvent, TrackingResult } from './types';

const BASE_URL = process.env.UPS_API_URL ?? 'https://onlinetools.ups.com';

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isUpsConfigured(): boolean {
  return Boolean(process.env.UPS_CLIENT_ID && process.env.UPS_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${process.env.UPS_CLIENT_ID}:${process.env.UPS_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${BASE_URL}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new CarrierApiError('ups', `OAuth failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as { access_token: string; expires_in: string };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
  };
  return data.access_token;
}

// UPS activity status types -> normalized status
const UPS_STATUS_MAP: Record<string, ShipmentStatus> = {
  M: 'label_created', // Manifest / billing info received
  P: 'picked_up',
  I: 'in_transit',
  O: 'out_for_delivery',
  D: 'delivered',
  X: 'exception',
  RS: 'exception', // returned to shipper
};

interface UpsActivity {
  status?: { type?: string; description?: string };
  location?: { address?: { city?: string; stateProvince?: string; countryCode?: string } };
  date?: string; // YYYYMMDD
  time?: string; // HHMMSS
}

function parseUpsTimestamp(date?: string, time?: string): string {
  if (!date) return new Date().toISOString();
  const d = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  const t = time ? `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}` : '00:00:00';
  return new Date(`${d}T${t}Z`).toISOString();
}

function formatLocation(activity: UpsActivity): string | null {
  const addr = activity.location?.address;
  if (!addr) return null;
  return [addr.city, addr.stateProvince, addr.countryCode].filter(Boolean).join(', ') || null;
}

export async function trackWithUps(trackingNumber: string): Promise<TrackingResult> {
  const token = await getAccessToken();

  const response = await fetch(
    `${BASE_URL}/api/track/v1/details/${encodeURIComponent(trackingNumber)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        transId: crypto.randomUUID(),
        transactionSrc: 'visucan',
      },
    }
  );

  if (!response.ok) {
    throw new CarrierApiError('ups', `Track API failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as {
    trackResponse?: {
      shipment?: Array<{
        package?: Array<{
          activity?: UpsActivity[];
          deliveryDate?: Array<{ type: string; date: string }>;
        }>;
      }>;
    };
  };

  const pkg = data.trackResponse?.shipment?.[0]?.package?.[0];
  const activities = pkg?.activity ?? [];

  const events: TrackingEvent[] = activities.map((activity) => ({
    status: UPS_STATUS_MAP[activity.status?.type ?? ''] ?? 'unknown',
    description: activity.status?.description ?? 'Status update',
    location: formatLocation(activity),
    timestamp: parseUpsTimestamp(activity.date, activity.time),
  }));

  const latest = events[0];
  const scheduled = pkg?.deliveryDate?.find((d) => d.type === 'SDD' || d.type === 'RDD');
  const delivered = events.find((e) => e.status === 'delivered');

  return {
    carrier: 'ups',
    carrierName: 'UPS',
    trackingNumber,
    status: latest?.status ?? 'unknown',
    statusDescription: latest?.description ?? 'No tracking information available',
    estimatedDelivery: scheduled ? parseUpsTimestamp(scheduled.date) : null,
    deliveredAt: delivered?.timestamp ?? null,
    events,
    live: true,
  };
}
