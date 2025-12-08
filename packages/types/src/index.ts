// ============================================================
// VISUCAN TYPE DEFINITIONS
// Core types for the entire platform
// ============================================================

// ============================================================
// USER & AUTHENTICATION
// ============================================================

export type SubscriptionTier = 'lite' | 'pro' | 'enterprise';

export type UserRole = 'user' | 'admin' | 'seller';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  subscription: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================
// SUBSCRIPTION & LIMITS
// ============================================================

export interface SubscriptionLimits {
  maxProjects: number;
  maxBoardWidth: number; // mm
  maxBoardHeight: number; // mm
  maxLayers: number;
  aiMessagesPerMonth: number;
  digikeySearchesPerMonth: number;
  pcbwayQuotesPerMonth: number;
  logoPlacement: boolean;
  orderTracking: boolean;
  marketplace: boolean;
  marketplaceFee: number; // percentage as decimal (0.05 = 5%)
  versionHistoryDays: number;
  collaborationMembers: number;
  draftsman: 'basic' | 'full' | 'custom';
  exportFormats: ('gerber' | 'bom' | 'pickplace' | 'pdf' | 'altium' | 'odb')[];
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
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
    maxProjects: -1, // unlimited
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
    maxBoardWidth: -1, // unlimited
    maxBoardHeight: -1,
    maxLayers: 4, // will increase to 8+ later
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

// ============================================================
// PROJECT & DESIGN
// ============================================================

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: ProjectStatus;

  // Board specifications
  boardWidth: number; // mm
  boardHeight: number; // mm
  layerCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt?: Date;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: number;
  description?: string;
  schematicData?: unknown;
  pcbData?: unknown;
  bomData?: unknown;
  createdAt: Date;
}

// ============================================================
// BLOCK DIAGRAM
// ============================================================

export type BlockType =
  | 'mcu'
  | 'power'
  | 'sensor'
  | 'communication'
  | 'connector'
  | 'memory'
  | 'display'
  | 'motor'
  | 'audio'
  | 'custom';

export interface BlockDiagramBlock {
  id: string;
  type: BlockType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color?: string;
  icon?: string;
  properties?: Record<string, unknown>;
}

export interface BlockDiagramConnection {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourcePort?: string;
  targetPort?: string;
  connectionType?: 'power' | 'data' | 'analog' | 'digital';
  label?: string;
}

export interface BlockDiagram {
  id: string;
  projectId: string;
  blocks: BlockDiagramBlock[];
  connections: BlockDiagramConnection[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// PCB DESIGN
// ============================================================

export type Layer =
  | 'top_copper'
  | 'inner1_copper'
  | 'inner2_copper'
  | 'bottom_copper'
  | 'top_silk'
  | 'bottom_silk'
  | 'top_mask'
  | 'bottom_mask'
  | 'top_paste'
  | 'bottom_paste'
  | 'outline'
  | 'drill';

export interface LayerStack {
  layers: Layer[];
  thickness: number; // mm
  copperWeight: '1oz' | '2oz';
  material: 'FR4' | 'Rogers' | 'Aluminum';
}

export interface LogoPlacement {
  id: string;
  projectId: string;
  fileUrl: string;
  fileType: 'png' | 'jpg' | 'svg' | 'dxf';
  layer: 'top_silk' | 'bottom_silk' | 'top_copper' | 'bottom_copper';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: 0 | 90 | 180 | 270;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// DRC (DESIGN RULE CHECK)
// ============================================================

export type DRCViolationType =
  | 'clearance'
  | 'short'
  | 'unconnected'
  | 'silk_overlap'
  | 'drill_hole'
  | 'trace_width'
  | 'annular_ring'
  | 'solder_mask'
  | 'board_outline';

export type DRCSeverity = 'error' | 'warning' | 'info';

export interface DRCViolation {
  id: string;
  type: DRCViolationType;
  severity: DRCSeverity;
  message: string;
  location?: { x: number; y: number };
  layer?: Layer;
  objectIds?: string[];
}

export interface DRCResult {
  passed: boolean;
  violations: DRCViolation[];
  errorCount: number;
  warningCount: number;
  runAt: Date;
}

// ============================================================
// COMPONENTS (DIGIKEY)
// ============================================================

export interface Component {
  id: string;
  digikeyPartNumber?: string;
  manufacturerPartNumber: string;
  manufacturer: string;
  description: string;
  category: string;

  // Pricing
  unitPrice: number;
  currency: string;
  stock: number;

  // Technical
  datasheetUrl?: string;
  imageUrl?: string;
  footprint?: string;
  symbol?: string;

  // Metadata
  specifications?: Record<string, string>;
}

export interface BOMItem {
  id: string;
  projectId: string;
  component: Component;
  quantity: number;
  designators: string[]; // e.g., ['R1', 'R2', 'R3']
  dnp: boolean; // Do Not Place
  notes?: string;
}

export interface BOM {
  id: string;
  projectId: string;
  items: BOMItem[];
  totalCost: number;
  currency: string;
  generatedAt: Date;
}

// ============================================================
// QUOTES & ORDERS (PCBWAY)
// ============================================================

export type PCBFinish = 'HASL' | 'ENIG' | 'OSP' | 'Immersion_Silver' | 'Immersion_Tin';

export type PCBColor = 'Green' | 'Red' | 'Blue' | 'Yellow' | 'White' | 'Black' | 'Purple';

export interface PCBSpecifications {
  width: number; // mm
  height: number; // mm
  layers: number;
  thickness: number; // mm
  copperWeight: '1oz' | '2oz';
  finish: PCBFinish;
  color: PCBColor;
  silkColor: 'White' | 'Black';
  minTraceWidth: number; // mm
  minSpacing: number; // mm
  minDrillSize: number; // mm
}

export interface QuoteConfirmation {
  id: string;
  projectId: string;
  userId: string;
  preview3dUrl?: string;
  topViewUrl?: string;
  bottomViewUrl?: string;
  specifications: PCBSpecifications;
  drcStatus: 'pass' | 'warnings' | 'errors';
  drcSummary: string;
  estimatedBOMCost: number;
  confirmedAt: Date;
}

export interface PCBQuote {
  id: string;
  projectId: string;
  confirmationId: string;

  // Quote details
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;

  // Lead times
  productionDays: number;
  shippingDays: number;

  // Provider
  provider: 'pcbway';
  providerQuoteId?: string;

  // Status
  expiresAt: Date;
  createdAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'in_production'
  | 'quality_check'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface PCBOrder {
  id: string;
  projectId: string;
  userId: string;
  quoteId: string;

  // Order details
  quantity: number;
  totalPrice: number;
  currency: string;

  // Payment
  stripePaymentIntentId?: string;
  paidAt?: Date;

  // Shipping
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;

  // Status
  status: OrderStatus;
  statusHistory: OrderStatusUpdate[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryAt?: Date;
  deliveredAt?: Date;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  message?: string;
  timestamp: Date;
}

export interface ShippingAddress {
  name: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// ============================================================
// MARKETPLACE
// ============================================================

export type ListingType = 'design_only' | 'assembled_board' | 'kit' | 'design_and_board';

export type ListingStatus = 'pending' | 'active' | 'rejected' | 'archived';

export type MarketplaceCategory =
  | 'arduino'
  | 'esp32'
  | 'raspberry_pi'
  | 'stm32'
  | 'sensors'
  | 'power'
  | 'motor_control'
  | 'audio'
  | 'wireless'
  | 'iot'
  | 'wearables'
  | 'robotics'
  | 'educational'
  | 'prototyping'
  | 'other';

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  projectId?: string;
  type: ListingType;

  // Product info
  title: string;
  description: string;
  category: MarketplaceCategory;
  tags: string[];
  images: string[];

  // Design files
  designFiles?: {
    includesGerber: boolean;
    includesAltium: boolean;
    includesBOM: boolean;
    includesSchematic: boolean;
  };

  // Pricing
  priceCents: number;
  currency: 'USD';
  shippingRates: ShippingRate[];

  // Options
  variants?: ProductVariant[];

  // Inventory (physical products)
  stockQuantity?: number;
  leadTimeDays?: number;

  // Stats
  viewCount: number;
  downloadCount: number;
  soldCount: number;
  averageRating: number;
  reviewCount: number;

  // Status
  status: ListingStatus;
  rejectionReason?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingRate {
  id: string;
  name: string;
  countries: string[]; // ISO country codes, ['US', 'CA'] or ['*'] for worldwide
  priceCents: number;
  estimatedDays: { min: number; max: number };
}

export interface ProductVariant {
  id: string;
  name: string;
  priceDeltaCents: number; // additional cost
  stockQuantity?: number;
}

export type MarketplaceOrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface MarketplaceOrder {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;

  // Order details
  quantity: number;
  unitPriceCents: number;
  shippingCents: number;
  totalCents: number;

  // Fees
  platformFeeCents: number;
  paymentFeeCents: number;
  sellerPayoutCents: number;

  // Shipping
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;

  // Payment
  stripePaymentIntentId?: string;

  // Status
  status: MarketplaceOrderStatus;

  // Timestamps
  createdAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface MarketplaceReview {
  id: string;
  listingId: string;
  orderId: string;
  buyerId: string;

  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  content?: string;

  // Seller response
  sellerResponse?: string;
  sellerRespondedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  amountCents: number;
  currency: 'USD';
  stripeTransferId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================
// AI CHAT
// ============================================================

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  projectId: string;
  role: ChatRole;
  content: string;
  metadata?: {
    suggestedComponents?: Component[];
    suggestedActions?: string[];
    drcResults?: DRCResult;
  };
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  projectId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// DRAFTSMAN REPORTS
// ============================================================

export type ReportType =
  | 'assembly_drawing'
  | 'fabrication_drawing'
  | 'bom_report'
  | 'schematic_print'
  | 'drill_chart'
  | 'layer_stack';

export interface DraftsmanReport {
  id: string;
  projectId: string;
  type: ReportType;
  title: string;
  fileUrl: string;
  format: 'pdf' | 'png';
  generatedAt: Date;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================
// EVENTS & NOTIFICATIONS
// ============================================================

export type NotificationType =
  | 'order_status'
  | 'design_shared'
  | 'review_received'
  | 'payout_completed'
  | 'listing_approved'
  | 'listing_rejected'
  | 'drc_completed'
  | 'quote_ready';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}
