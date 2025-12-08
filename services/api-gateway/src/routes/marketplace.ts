// ============================================================
// MARKETPLACE ROUTES
// ============================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createSuccessResponse, getSubscriptionLimits, calculateMarketplaceFees, createListingSchema } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate, optionalAuth } from '../middleware/auth';
import { db } from '@visucan/database/client';

export async function marketplaceRoutes(fastify: FastifyInstance) {
  // Public routes
  // List marketplace items
  fastify.get('/', { preHandler: optionalAuth }, async (request: FastifyRequest) => {
    const { category, page = 1, limit = 20, sort = 'newest' } = request.query as {
      category?: string;
      page?: number;
      limit?: number;
      sort?: 'newest' | 'popular' | 'price_low' | 'price_high';
    };

    const where = {
      status: 'ACTIVE' as const,
      ...(category && { category }),
    };

    const orderBy = {
      newest: { createdAt: 'desc' as const },
      popular: { soldCount: 'desc' as const },
      price_low: { priceCents: 'asc' as const },
      price_high: { priceCents: 'desc' as const },
    }[sort];

    const [listings, total] = await Promise.all([
      db.marketplaceListing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.marketplaceListing.count({ where }),
    ]);

    return createSuccessResponse({
      items: listings.map((l) => ({
        ...l,
        status: l.status.toLowerCase(),
        type: l.type.toLowerCase(),
      })),
      total,
      page,
      pageSize: limit,
      hasMore: page * limit < total,
    });
  });

  // Get listing details
  fastify.get('/:id', { preHandler: optionalAuth }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const listing = await db.marketplaceListing.findFirst({
      where: { id, status: 'ACTIVE' },
      include: {
        seller: { select: { id: true, name: true, avatarUrl: true } },
        reviews: {
          include: { buyer: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!listing) {
      throw ApiError.notFound('Listing not found');
    }

    // Increment view count
    await db.marketplaceListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return createSuccessResponse({
      ...listing,
      status: listing.status.toLowerCase(),
      type: listing.type.toLowerCase(),
    });
  });

  // Get categories
  fastify.get('/categories', async () => {
    const categories = [
      { id: 'arduino', name: 'Arduino Compatible', icon: 'cpu' },
      { id: 'esp32', name: 'ESP32 / ESP8266', icon: 'wifi' },
      { id: 'raspberry_pi', name: 'Raspberry Pi', icon: 'server' },
      { id: 'stm32', name: 'STM32', icon: 'chip' },
      { id: 'sensors', name: 'Sensors', icon: 'activity' },
      { id: 'power', name: 'Power Management', icon: 'zap' },
      { id: 'motor_control', name: 'Motor Control', icon: 'settings' },
      { id: 'audio', name: 'Audio', icon: 'volume-2' },
      { id: 'wireless', name: 'Wireless', icon: 'radio' },
      { id: 'iot', name: 'IoT', icon: 'globe' },
      { id: 'wearables', name: 'Wearables', icon: 'watch' },
      { id: 'robotics', name: 'Robotics', icon: 'bot' },
      { id: 'educational', name: 'Educational', icon: 'graduation-cap' },
      { id: 'prototyping', name: 'Prototyping', icon: 'layout' },
      { id: 'other', name: 'Other', icon: 'package' },
    ];

    return createSuccessResponse(categories);
  });

  // Get seller store
  fastify.get('/stores/:sellerId', { preHandler: optionalAuth }, async (request: FastifyRequest) => {
    const { sellerId } = request.params as { sellerId: string };

    const seller = await db.user.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, avatarUrl: true, createdAt: true },
    });

    if (!seller) {
      throw ApiError.notFound('Seller not found');
    }

    const [listings, stats] = await Promise.all([
      db.marketplaceListing.findMany({
        where: { sellerId, status: 'ACTIVE' },
        orderBy: { soldCount: 'desc' },
        take: 20,
      }),
      db.marketplaceListing.aggregate({
        where: { sellerId, status: 'ACTIVE' },
        _count: true,
        _avg: { averageRating: true },
        _sum: { soldCount: true },
      }),
    ]);

    return createSuccessResponse({
      seller: {
        ...seller,
        totalListings: stats._count,
        averageRating: stats._avg.averageRating || 0,
        totalSales: stats._sum.soldCount || 0,
      },
      listings: listings.map((l) => ({
        ...l,
        status: l.status.toLowerCase(),
        type: l.type.toLowerCase(),
      })),
    });
  });

  // Authenticated routes
  // Create listing
  fastify.post('/', { preHandler: authenticate }, async (request: FastifyRequest) => {
    const user = request.user!;

    // Check marketplace access
    const limits = getSubscriptionLimits(user.subscription);
    if (!limits.marketplace) {
      throw ApiError.forbidden('Marketplace selling requires Pro or Enterprise subscription');
    }

    const body = createListingSchema.parse(request.body);

    const listing = await db.marketplaceListing.create({
      data: {
        sellerId: user.id,
        type: body.type.toUpperCase() as any,
        title: body.title,
        description: body.description,
        category: body.category,
        tags: body.tags || [],
        images: [],
        priceCents: body.priceCents,
        stockQuantity: body.stockQuantity,
        status: 'PENDING',
      },
    });

    return createSuccessResponse({
      ...listing,
      status: listing.status.toLowerCase(),
      type: listing.type.toLowerCase(),
      message: 'Listing created and pending review',
    });
  });

  // Update listing
  fastify.patch('/:id', { preHandler: authenticate }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        priceCents: z.number().int().positive().optional(),
        stockQuantity: z.number().int().positive().optional(),
        tags: z.array(z.string()).optional(),
      })
      .parse(request.body);

    const listing = await db.marketplaceListing.findFirst({
      where: { id, sellerId: request.user!.id },
    });

    if (!listing) {
      throw ApiError.notFound('Listing not found');
    }

    const updated = await db.marketplaceListing.update({
      where: { id },
      data: body,
    });

    return createSuccessResponse({
      ...updated,
      status: updated.status.toLowerCase(),
      type: updated.type.toLowerCase(),
    });
  });

  // Delete listing
  fastify.delete('/:id', { preHandler: authenticate }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const listing = await db.marketplaceListing.findFirst({
      where: { id, sellerId: request.user!.id },
    });

    if (!listing) {
      throw ApiError.notFound('Listing not found');
    }

    await db.marketplaceListing.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return createSuccessResponse({ message: 'Listing archived' });
  });

  // Purchase listing
  fastify.post('/:id/purchase', { preHandler: authenticate }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        quantity: z.number().int().positive(),
        shippingAddress: z.object({
          name: z.string(),
          addressLine1: z.string(),
          addressLine2: z.string().optional(),
          city: z.string(),
          state: z.string().optional(),
          postalCode: z.string(),
          country: z.string(),
        }),
      })
      .parse(request.body);

    const buyer = request.user!;

    const listing = await db.marketplaceListing.findFirst({
      where: { id, status: 'ACTIVE' },
      include: { seller: true },
    });

    if (!listing) {
      throw ApiError.notFound('Listing not found');
    }

    if (listing.sellerId === buyer.id) {
      throw ApiError.badRequest('Cannot purchase your own listing');
    }

    if (listing.stockQuantity !== null && listing.stockQuantity < body.quantity) {
      throw ApiError.badRequest('Insufficient stock');
    }

    // Calculate fees
    const sellerLimits = getSubscriptionLimits(
      listing.seller.subscription.toLowerCase() as any
    );
    const fees = calculateMarketplaceFees(
      listing.priceCents * body.quantity,
      listing.seller.subscription.toLowerCase() as any
    );

    // TODO: Create Stripe payment intent

    const order = await db.marketplaceOrder.create({
      data: {
        listingId: listing.id,
        buyerId: buyer.id,
        sellerId: listing.sellerId,
        quantity: body.quantity,
        unitPriceCents: listing.priceCents,
        shippingCents: 0, // TODO: Calculate shipping
        totalCents: listing.priceCents * body.quantity,
        platformFeeCents: fees.platformFeeCents,
        paymentFeeCents: fees.paymentFeeCents,
        sellerPayoutCents: fees.sellerPayoutCents,
        shippingAddress: body.shippingAddress,
        status: 'PENDING',
      },
    });

    return createSuccessResponse({
      orderId: order.id,
      totalCents: order.totalCents,
      // Return Stripe client_secret in real implementation
    });
  });

  // Seller dashboard
  fastify.get('/seller/dashboard', { preHandler: authenticate }, async (request: FastifyRequest) => {
    const user = request.user!;

    const [listings, orders, pendingPayout, recentOrders] = await Promise.all([
      db.marketplaceListing.aggregate({
        where: { sellerId: user.id },
        _count: true,
        _sum: { soldCount: true, viewCount: true },
      }),
      db.marketplaceOrder.aggregate({
        where: { sellerId: user.id },
        _count: true,
        _sum: { sellerPayoutCents: true },
      }),
      db.marketplaceOrder.aggregate({
        where: { sellerId: user.id, status: 'DELIVERED' },
        _sum: { sellerPayoutCents: true },
      }),
      db.marketplaceOrder.findMany({
        where: { sellerId: user.id },
        include: { listing: { select: { title: true } }, buyer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return createSuccessResponse({
      stats: {
        totalListings: listings._count,
        totalSales: listings._sum.soldCount || 0,
        totalViews: listings._sum.viewCount || 0,
        totalOrders: orders._count,
        totalRevenue: orders._sum.sellerPayoutCents || 0,
        pendingPayout: pendingPayout._sum.sellerPayoutCents || 0,
      },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        status: o.status.toLowerCase(),
      })),
    });
  });

  // Ship order
  fastify.put('/seller/orders/:orderId/ship', { preHandler: authenticate }, async (request: FastifyRequest) => {
    const { orderId } = request.params as { orderId: string };
    const { trackingNumber, carrier } = z
      .object({
        trackingNumber: z.string(),
        carrier: z.string(),
      })
      .parse(request.body);

    const order = await db.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId: request.user!.id },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status !== 'PAID' && order.status !== 'PROCESSING') {
      throw ApiError.badRequest('Order cannot be shipped at this stage');
    }

    const updated = await db.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        trackingNumber,
        carrier,
        shippedAt: new Date(),
      },
    });

    return createSuccessResponse({
      ...updated,
      status: updated.status.toLowerCase(),
    });
  });
}
