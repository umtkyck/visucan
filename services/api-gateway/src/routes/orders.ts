// ============================================================
// ORDER ROUTES
// ============================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createSuccessResponse, getSubscriptionLimits } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';
import { db } from '@visucan/database/client';

const shippingAddressSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().min(2).max(2),
  phone: z.string().optional(),
});

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Create order from quote
  fastify.post('/', async (request: FastifyRequest) => {
    const body = z
      .object({
        quoteId: z.string(),
        shippingAddress: shippingAddressSchema,
      })
      .parse(request.body);

    const user = request.user!;

    // Check order tracking feature access
    const limits = getSubscriptionLimits(user.subscription);
    if (!limits.orderTracking) {
      throw ApiError.forbidden('Order tracking requires Pro or Enterprise subscription');
    }

    // Get quote
    const quote = await db.pCBQuote.findFirst({
      where: {
        id: body.quoteId,
        project: { userId: user.id },
      },
      include: { project: true },
    });

    if (!quote) {
      throw ApiError.notFound('Quote not found');
    }

    // Check if quote is expired
    if (quote.expiresAt < new Date()) {
      throw ApiError.badRequest('Quote has expired, please request a new quote');
    }

    // TODO: Create Stripe payment intent
    const stripePaymentIntentId = 'pi_mock_' + crypto.randomUUID();

    // Create order
    const order = await db.pCBOrder.create({
      data: {
        projectId: quote.projectId,
        userId: user.id,
        quoteId: quote.id,
        quantity: quote.quantity,
        totalPrice: quote.totalPrice,
        currency: quote.currency,
        stripePaymentIntentId,
        shippingAddress: body.shippingAddress,
        status: 'PENDING',
        statusHistory: [
          {
            status: 'pending',
            message: 'Order created, awaiting payment',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    return createSuccessResponse({
      id: order.id,
      status: order.status.toLowerCase(),
      totalPrice: order.totalPrice,
      currency: order.currency,
      paymentIntentId: stripePaymentIntentId,
      // In real implementation, return client_secret for Stripe
    });
  });

  // List orders
  fastify.get('/', async (request: FastifyRequest) => {
    const { page = 1, limit = 20, status } = request.query as {
      page?: number;
      limit?: number;
      status?: string;
    };

    const where = {
      userId: request.user!.id,
      ...(status && { status: status.toUpperCase() as any }),
    };

    const [orders, total] = await Promise.all([
      db.pCBOrder.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          quote: { select: { quantity: true, productionDays: true, shippingDays: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pCBOrder.count({ where }),
    ]);

    return createSuccessResponse({
      items: orders.map((o) => ({
        ...o,
        status: o.status.toLowerCase(),
      })),
      total,
      page,
      pageSize: limit,
      hasMore: page * limit < total,
    });
  });

  // Get order by ID
  fastify.get('/:id', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const order = await db.pCBOrder.findFirst({
      where: { id, userId: request.user!.id },
      include: {
        project: true,
        quote: {
          include: { confirmation: true },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return createSuccessResponse({
      ...order,
      status: order.status.toLowerCase(),
    });
  });

  // Get order tracking info
  fastify.get('/:id/tracking', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const order = await db.pCBOrder.findFirst({
      where: { id, userId: request.user!.id },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // TODO: Get real tracking info from carrier API
    return createSuccessResponse({
      orderId: order.id,
      status: order.status.toLowerCase(),
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      statusHistory: order.statusHistory,
      estimatedDelivery: order.estimatedDeliveryAt,
      deliveredAt: order.deliveredAt,
    });
  });

  // Cancel order (only if pending)
  fastify.post('/:id/cancel', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const order = await db.pCBOrder.findFirst({
      where: { id, userId: request.user!.id },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status !== 'PENDING' && order.status !== 'PAID') {
      throw ApiError.badRequest('Order cannot be cancelled at this stage');
    }

    // TODO: Process refund through Stripe if paid

    const updatedOrder = await db.pCBOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        statusHistory: [
          ...(order.statusHistory as any[]),
          {
            status: 'cancelled',
            message: 'Order cancelled by user',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    return createSuccessResponse({
      id: updatedOrder.id,
      status: updatedOrder.status.toLowerCase(),
      message: 'Order cancelled successfully',
    });
  });
}
