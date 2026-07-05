import Link from 'next/link';
import { ArrowLeft, Landmark } from 'lucide-react';
import { COMPANY, REMITTANCE } from '@/lib/billing';
import { CopyButton } from '@/components/billing/copy-button';

export const metadata = {
  title: 'Billing',
};

interface DetailRow {
  label: string;
  value: string;
  copyable?: boolean;
}

const WIRE_DETAILS: DetailRow[] = [
  { label: 'Beneficiary', value: REMITTANCE.beneficiary, copyable: true },
  { label: 'Bank', value: REMITTANCE.bank },
  { label: 'Account number', value: REMITTANCE.accountNumber, copyable: true },
  { label: 'Account type', value: REMITTANCE.accountType },
  {
    label: 'ABA routing (ACH / domestic wire)',
    value: REMITTANCE.abaRouting,
    copyable: true,
  },
  { label: 'SWIFT / BIC (international)', value: REMITTANCE.swift, copyable: true },
  {
    label: 'Intermediary SWIFT / BIC',
    value: REMITTANCE.intermediarySwift,
    copyable: true,
  },
  { label: 'Bank address', value: REMITTANCE.bankAddress },
];

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
            <Landmark className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pay by Bank Transfer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ACH, domestic wire, and international wire payments
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="font-medium text-gray-900 dark:text-white">
              Remit payment to
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              All invoices are payable to {COMPANY.legalName}, the company behind{' '}
              {COMPANY.product}.
            </p>
          </div>
          <dl className="divide-y divide-gray-100 dark:divide-gray-800">
            {WIRE_DETAILS.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 px-6 py-3.5"
              >
                <dt className="text-sm text-gray-500">{row.label}</dt>
                <dd className="flex items-center gap-1 text-right">
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {row.value}
                  </span>
                  {row.copyable && <CopyButton value={row.value} />}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-medium">Payment reference</p>
          <p className="mt-1">
            Include your VisuCAN order number (or account email) in the wire
            reference / memo field so we can match your payment. Orders are
            processed once funds clear — typically 1–2 business days for ACH and
            same day for wires.
          </p>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Questions about an invoice? Contact{' '}
          <a
            href="mailto:umtkyck@gmail.com"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            umtkyck@gmail.com
          </a>{' '}
          or call{' '}
          <a
            href="tel:+12246299664"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            +1 (224) 629-9664
          </a>
          .
        </p>
      </main>
    </div>
  );
}
