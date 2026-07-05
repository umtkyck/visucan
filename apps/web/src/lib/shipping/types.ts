// Normalized shipping types shared by all North American carrier adapters.

export const CARRIERS = ['ups', 'fedex', 'usps'] as const;
export type Carrier = (typeof CARRIERS)[number];

export type ShipmentStatus =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'unknown';

export interface TrackingEvent {
  status: ShipmentStatus;
  description: string;
  location: string | null;
  timestamp: string; // ISO 8601
}

export interface TrackingResult {
  carrier: Carrier;
  carrierName: string;
  trackingNumber: string;
  status: ShipmentStatus;
  statusDescription: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  events: TrackingEvent[];
  /** true when the data came from the carrier's live API */
  live: boolean;
  note?: string;
}

export interface CarrierInfo {
  id: Carrier;
  name: string;
  country: string;
  /** live API credentials are configured via env vars */
  configured: boolean;
  trackingUrl: (trackingNumber: string) => string;
}

export const CARRIER_NAMES: Record<Carrier, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  usps: 'USPS',
};

export class CarrierApiError extends Error {
  constructor(
    public readonly carrier: Carrier,
    message: string,
    public readonly statusCode?: number
  ) {
    super(`[${carrier}] ${message}`);
  }
}
