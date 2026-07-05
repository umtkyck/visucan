// Company + remittance details for bank transfer (ACH / wire) payments.
// Shown only on authenticated billing pages.

export const COMPANY = {
  legalName: 'Melis Electronics LLC',
  product: 'VisuCAN',
} as const;

export const REMITTANCE = {
  beneficiary: 'Melis Electronics LLC',
  bank: 'Mercury (Choice Financial Group)',
  accountNumber: '738169316558493',
  accountType: 'Checking',
  abaRouting: '121145433', // ACH / Domestic Wire
  swift: 'CLNOUS66MER', // International
  intermediarySwift: 'CHASUS33XXX',
  bankAddress:
    '1 Letterman Drive, Building A, Suite A4-700, San Francisco, CA 94129 US',
} as const;
