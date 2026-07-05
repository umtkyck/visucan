'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Truck,
  PackageCheck,
  PackageX,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Modal, Button, Input, Spinner } from '@visucan/ui';
import { shippingApi } from '@/lib/api';
import type { TrackingResultDto } from '@/lib/api';

interface TrackShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CARRIER_OPTIONS = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'ups', label: 'UPS' },
  { id: 'fedex', label: 'FedEx' },
  { id: 'usps', label: 'USPS' },
] as const;

const TRACKING_URLS: Record<string, (n: string) => string> = {
  ups: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  usps: (n) =>
    `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
};

const STATUS_LABELS: Record<string, string> = {
  label_created: 'Label created',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  exception: 'Exception',
  unknown: 'Unknown',
};

function statusColor(status: string): string {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'exception':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function TrackShipmentModal({ isOpen, onClose }: TrackShipmentModalProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState<string>('auto');
  const [result, setResult] = useState<TrackingResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trackMutation = useMutation({
    mutationFn: () =>
      shippingApi.track(
        trackingNumber.trim(),
        carrier === 'auto' ? undefined : (carrier as 'ups' | 'fedex' | 'usps')
      ),
    onSuccess: (response) => {
      if (!response.success || !response.data) {
        setError(response.error?.message ?? 'Tracking failed');
        setResult(null);
        return;
      }
      setResult(response.data);
      setError(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (trackingNumber.trim().length < 6) {
      setError('Enter a valid tracking number');
      return;
    }
    trackMutation.mutate();
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Track Shipment"
      description="Track PCB orders shipped via UPS, FedEx, or USPS."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tracking number"
          placeholder="e.g. 1Z999AA10123456784"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          maxLength={40}
          autoFocus
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Carrier
          </label>
          <div className="flex gap-2">
            {CARRIER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCarrier(option.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  carrier === option.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" disabled={trackMutation.isPending} className="w-full">
          {trackMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" /> Tracking…
            </span>
          ) : (
            'Track package'
          )}
        </Button>
      </form>

      {result && (
        <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {result.status === 'delivered' ? (
                <PackageCheck className="h-8 w-8 text-green-500" />
              ) : result.status === 'exception' ? (
                <PackageX className="h-8 w-8 text-red-500" />
              ) : (
                <Truck className="h-8 w-8 text-primary-500" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {result.carrierName}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(result.status)}`}
                  >
                    {STATUS_LABELS[result.status] ?? result.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {result.statusDescription}
                </p>
              </div>
            </div>
            <a
              href={TRACKING_URLS[result.carrier]?.(result.trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Carrier site
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {result.estimatedDelivery && !result.deliveredAt && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Estimated delivery:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(result.estimatedDelivery).toLocaleDateString()}
              </span>
            </p>
          )}

          {result.events.length > 0 && (
            <ol className="mt-4 space-y-3">
              {result.events.slice(0, 6).map((event, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span
                    className={`mt-1.5 block h-2 w-2 shrink-0 rounded-full ${
                      index === 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                  <div>
                    <p className="text-gray-900 dark:text-white">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                      {event.location && (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {!result.live && result.note && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              {result.note}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
