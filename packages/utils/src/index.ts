// ============================================================
// VISUCAN UTILITIES
// Shared utility functions
// ============================================================

import { z } from 'zod';
import type {
  SubscriptionTier,
  SubscriptionLimits,
  SUBSCRIPTION_LIMITS,
  ApiResponse,
  ApiError,
} from '@visucan/types';

// Re-export types for convenience
export * from '@visucan/types';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const projectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be less than 100 characters');

export const boardDimensionsSchema = z.object({
  width: z.number().positive('Width must be positive').max(500, 'Max width is 500mm'),
  height: z.number().positive('Height must be positive').max(500, 'Max height is 500mm'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: z.string().max(500).optional(),
  boardWidth: z.number().positive().default(50),
  boardHeight: z.number().positive().default(50),
  layerCount: z.number().int().min(1).max(4).default(2),
});

export const createListingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  category: z.string(),
  type: z.enum(['design_only', 'assembled_board', 'kit', 'design_and_board']),
  priceCents: z.number().int().positive(),
  tags: z.array(z.string()).max(10).optional(),
  stockQuantity: z.number().int().positive().optional(),
});

// ============================================================
// API HELPERS
// ============================================================

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export function isApiError(response: ApiResponse<unknown>): response is ApiResponse<never> & { error: ApiError } {
  return !response.success && response.error !== undefined;
}

// ============================================================
// SUBSCRIPTION HELPERS
// ============================================================

export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  const limits: Record<SubscriptionTier, SubscriptionLimits> = {
    lite: {
      maxProjects: 2,
      maxBoardWidth: 100,
      maxBoardHeight: 100,
      maxLayers: 2,
      aiMessagesPerMonth: 50,
      digikeySearchesPerMonth: 100,
      pcbwayQuotesPerMonth: 5,
      logoPlacement: false,
      orderTracking: false,
      marketplace: false,
      marketplaceFee: 0,
      versionHistoryDays: 3,
      collaborationMembers: 0,
      draftsman: 'basic',
      exportFormats: ['gerber'],
    },
    pro: {
      maxProjects: -1,
      maxBoardWidth: 300,
      maxBoardHeight: 300,
      maxLayers: 4,
      aiMessagesPerMonth: 500,
      digikeySearchesPerMonth: -1,
      pcbwayQuotesPerMonth: -1,
      logoPlacement: true,
      orderTracking: true,
      marketplace: true,
      marketplaceFee: 0.05,
      versionHistoryDays: 30,
      collaborationMembers: 3,
      draftsman: 'full',
      exportFormats: ['gerber', 'bom', 'pickplace', 'pdf', 'altium', 'odb'],
    },
    enterprise: {
      maxProjects: -1,
      maxBoardWidth: -1,
      maxBoardHeight: -1,
      maxLayers: 4,
      aiMessagesPerMonth: -1,
      digikeySearchesPerMonth: -1,
      pcbwayQuotesPerMonth: -1,
      logoPlacement: true,
      orderTracking: true,
      marketplace: true,
      marketplaceFee: 0.03,
      versionHistoryDays: -1,
      collaborationMembers: -1,
      draftsman: 'custom',
      exportFormats: ['gerber', 'bom', 'pickplace', 'pdf', 'altium', 'odb'],
    },
  };
  return limits[tier];
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function checkLimit(current: number, limit: number): boolean {
  return isUnlimited(limit) || current < limit;
}

export function canUseFeature(tier: SubscriptionTier, feature: keyof SubscriptionLimits): boolean {
  const limits = getSubscriptionLimits(tier);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return true;
}

// ============================================================
// FORMATTING HELPERS
// ============================================================

export function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function formatBoardSize(width: number, height: number): string {
  return `${width} × ${height} mm`;
}

export function formatLayerCount(layers: number): string {
  return `${layers}-layer`;
}

// ============================================================
// ID GENERATION
// ============================================================

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateShortId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================
// SLUG GENERATION
// ============================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ============================================================
// PCB HELPERS
// ============================================================

export const QUANTITY_OPTIONS = [5, 10, 20, 50, 100] as const;

export const PCB_COLORS = ['Green', 'Red', 'Blue', 'Yellow', 'White', 'Black', 'Purple'] as const;

export const PCB_FINISHES = ['HASL', 'ENIG', 'OSP', 'Immersion_Silver', 'Immersion_Tin'] as const;

export const COPPER_WEIGHTS = ['1oz', '2oz'] as const;

export function calculateBoardArea(width: number, height: number): number {
  return (width * height) / 100; // cm²
}

export function estimateViaCount(componentCount: number, layers: number): number {
  // Rough estimation
  return Math.ceil(componentCount * layers * 1.5);
}

// ============================================================
// MARKETPLACE HELPERS
// ============================================================

export function calculateMarketplaceFees(
  priceCents: number,
  tier: SubscriptionTier
): {
  platformFeeCents: number;
  paymentFeeCents: number;
  sellerPayoutCents: number;
} {
  const limits = getSubscriptionLimits(tier);
  const platformFeeCents = Math.ceil(priceCents * limits.marketplaceFee);
  const paymentFeeCents = Math.ceil(priceCents * 0.029) + 30; // Stripe: 2.9% + $0.30
  const sellerPayoutCents = priceCents - platformFeeCents - paymentFeeCents;

  return {
    platformFeeCents,
    paymentFeeCents,
    sellerPayoutCents,
  };
}

// ============================================================
// ARRAY HELPERS
// ============================================================

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

// ============================================================
// ASYNC HELPERS
// ============================================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt); // Exponential backoff
      }
    }
  }

  throw lastError;
}

// ============================================================
// ENVIRONMENT HELPERS
// ============================================================

export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnvVarOptional(name: string): string | undefined {
  return process.env[name];
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
