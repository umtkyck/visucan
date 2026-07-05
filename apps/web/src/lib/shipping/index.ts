// North American shipping provider integration layer.
//
// Each carrier (UPS, FedEx, USPS) has a live API adapter that activates when
// its credentials are present in the environment. Without credentials the
// tracker returns deterministic simulated data flagged with `live: false`,
// so the product flow works end to end before the carrier accounts are wired.
//
// Required env vars for live mode:
//   UPS_CLIENT_ID / UPS_CLIENT_SECRET       (developer.ups.com)
//   FEDEX_CLIENT_ID / FEDEX_CLIENT_SECRET   (developer.fedex.com)
//   USPS_CLIENT_ID / USPS_CLIENT_SECRET     (developer.usps.com)

import { CARRIER_NAMES, CarrierApiError, CARRIERS } from './types';
import type {
  Carrier,
  CarrierInfo,
  ShipmentStatus,
  TrackingEvent,
  TrackingResult,
} from './types';
import { isUpsConfigured, trackWithUps } from './ups';
import { isFedexConfigured, trackWithFedex } from './fedex';
import { isUspsConfigured, trackWithUsps } from './usps';

export type { Carrier, TrackingResult, TrackingEvent, ShipmentStatus, CarrierInfo };
export { CARRIERS, CarrierApiError };

const TRACKING_URLS: Record<Carrier, (n: string) => string> = {
  ups: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  usps: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
};

const CONFIGURED_CHECKS: Record<Carrier, () => boolean> = {
  ups: isUpsConfigured,
  fedex: isFedexConfigured,
  usps: isUspsConfigured,
};

const LIVE_TRACKERS: Record<Carrier, (trackingNumber: string) => Promise<TrackingResult>> = {
  ups: trackWithUps,
  fedex: trackWithFedex,
  usps: trackWithUsps,
};

export function getCarriers(): CarrierInfo[] {
  return CARRIERS.map((id) => ({
    id,
    name: CARRIER_NAMES[id],
    country: 'US',
    configured: CONFIGURED_CHECKS[id](),
    trackingUrl: TRACKING_URLS[id],
  }));
}

/** Best-effort carrier detection from the tracking number format. */
export function detectCarrier(trackingNumber: string): Carrier | null {
  const value = trackingNumber.trim().toUpperCase();
  if (/^1Z[0-9A-Z]{16}$/.test(value)) return 'ups';
  // USPS: 20-22 digits starting with 9, or intl format ending in US
  if (/^9\d{19,21}$/.test(value) || /^[A-Z]{2}\d{9}US$/.test(value)) return 'usps';
  // FedEx: 12, 15, or 20 digit numbers
  if (/^\d{12}$/.test(value) || /^\d{15}$/.test(value) || /^\d{20}$/.test(value)) return 'fedex';
  return null;
}

export async function trackShipment(
  carrier: Carrier,
  trackingNumber: string
): Promise<TrackingResult> {
  if (CONFIGURED_CHECKS[carrier]()) {
    return LIVE_TRACKERS[carrier](trackingNumber);
  }
  return simulateTracking(carrier, trackingNumber);
}

// ------------------------------------------------------------------
// Simulation mode (no credentials configured)
// ------------------------------------------------------------------

/** Deterministic hash so the same tracking number always yields the same journey. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const SIMULATED_ROUTES: Array<{ city: string; state: string }[]> = [
  [
    { city: 'Shenzhen', state: 'CN' },
    { city: 'Anchorage', state: 'AK' },
    { city: 'Louisville', state: 'KY' },
    { city: 'Chicago', state: 'IL' },
    { city: 'Naperville', state: 'IL' },
  ],
  [
    { city: 'Memphis', state: 'TN' },
    { city: 'Indianapolis', state: 'IN' },
    { city: 'Chicago', state: 'IL' },
    { city: 'Aurora', state: 'IL' },
    { city: 'Naperville', state: 'IL' },
  ],
];

function simulateTracking(carrier: Carrier, trackingNumber: string): TrackingResult {
  const hash = hashString(`${carrier}:${trackingNumber}`);
  const route = SIMULATED_ROUTES[hash % SIMULATED_ROUTES.length];
  // Journey progress 2..5 stops so different numbers show different stages
  const progress = 2 + (hash % 4);
  const now = Date.now();
  const stepMs = 18 * 60 * 60 * 1000; // ~18h between scans

  const stages: Array<{ status: ShipmentStatus; description: string }> = [
    { status: 'label_created', description: 'Shipping label created, awaiting pickup' },
    { status: 'picked_up', description: 'Package picked up by carrier' },
    { status: 'in_transit', description: 'Departed sorting facility' },
    { status: 'out_for_delivery', description: 'Out for delivery' },
    { status: 'delivered', description: 'Delivered — signed at front desk' },
  ];

  const visibleStages = stages.slice(0, progress + 1);
  const events: TrackingEvent[] = visibleStages
    .map((stage, index) => ({
      status: stage.status,
      description: stage.description,
      location: route[Math.min(index, route.length - 1)]
        ? `${route[Math.min(index, route.length - 1)].city}, ${route[Math.min(index, route.length - 1)].state}`
        : null,
      timestamp: new Date(now - (visibleStages.length - index) * stepMs).toISOString(),
    }))
    .reverse();

  const latest = events[0];
  const isDelivered = latest.status === 'delivered';

  return {
    carrier,
    carrierName: CARRIER_NAMES[carrier],
    trackingNumber,
    status: latest.status,
    statusDescription: latest.description,
    estimatedDelivery: isDelivered ? null : new Date(now + 2 * stepMs).toISOString(),
    deliveredAt: isDelivered ? latest.timestamp : null,
    events,
    live: false,
    note: `${CARRIER_NAMES[carrier]} API credentials are not configured — showing simulated tracking data. Set ${carrier.toUpperCase()}_CLIENT_ID and ${carrier.toUpperCase()}_CLIENT_SECRET to enable live tracking.`,
  };
}
