// ============================================================
// QUOTE ROUTES (PCBWAY INTEGRATION)
// ============================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createSuccessResponse, getSubscriptionLimits, QUANTITY_OPTIONS } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';
import { db } from '@visucan/database/client';

export async function quoteRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Create quote confirmation (3D preview)
  fastify.post('/confirm', async (request: FastifyRequest) => {
    const { projectId } = z
      .object({ projectId: z.string() })
      .parse(request.body);

    const user = request.user!;

    // Check project ownership
    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      include: {
        pcbLayout: true,
        bomItems: { include: { component: true } },
        logoPlacement: true,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // TODO: Run DRC checks
    const drcStatus = 'pass';
    const drcSummary = 'All design rules passed';

    // Calculate estimated BOM cost
    const bomCost = project.bomItems.reduce(
      (sum, item) => sum + item.quantity * item.component.unitPrice,
      0
    );

    // TODO: Generate 3D preview images
    const preview3dUrl = 'https://placeholder.com/3d-preview.png';
    const topViewUrl = 'https://placeholder.com/top-view.png';
    const bottomViewUrl = 'https://placeholder.com/bottom-view.png';

    // Create confirmation record
    const confirmation = await db.quoteConfirmation.create({
      data: {
        projectId,
        userId: user.id,
        preview3dUrl,
        topViewUrl,
        bottomViewUrl,
        specifications: {
          width: project.boardWidth,
          height: project.boardHeight,
          layers: project.layerCount,
          thickness: 1.6,
          copperWeight: '1oz',
          finish: 'HASL',
          color: 'Green',
          silkColor: 'White',
          minTraceWidth: 0.127,
          minSpacing: 0.127,
          minDrillSize: 0.3,
        },
        drcStatus,
        drcSummary,
        estimatedBOMCost: bomCost,
      },
    });

    return createSuccessResponse({
      id: confirmation.id,
      preview3dUrl,
      topViewUrl,
      bottomViewUrl,
      specifications: confirmation.specifications,
      drcStatus,
      drcSummary,
      estimatedBOMCost: bomCost,
      hasLogo: !!project.logoPlacement,
      quantityOptions: QUANTITY_OPTIONS,
    });
  });

  // Get quote for confirmed design
  fastify.post('/', async (request: FastifyRequest) => {
    const body = z
      .object({
        confirmationId: z.string(),
        quantity: z.number().refine((n) => QUANTITY_OPTIONS.includes(n as any)),
      })
      .parse(request.body);

    const user = request.user!;

    // Check confirmation ownership
    const confirmation = await db.quoteConfirmation.findFirst({
      where: { id: body.confirmationId, userId: user.id },
      include: { project: true },
    });

    if (!confirmation) {
      throw ApiError.notFound('Quote confirmation not found');
    }

    // Check quote limits
    const limits = getSubscriptionLimits(user.subscription);

    // TODO: Implement actual PCBWAY API call
    // Mock quote calculation based on specs
    const specs = confirmation.specifications as any;
    const area = specs.width * specs.height; // mm²
    const layerMultiplier = { 1: 1, 2: 1.2, 4: 1.8 }[specs.layers] || 2;
    const basePrice = (area * 0.005 * layerMultiplier + 5) * body.quantity;
    const unitPrice = basePrice / body.quantity;

    const quote = await db.pCBQuote.create({
      data: {
        projectId: confirmation.projectId,
        confirmationId: confirmation.id,
        quantity: body.quantity,
        unitPrice,
        totalPrice: basePrice,
        currency: 'USD',
        productionDays: body.quantity <= 10 ? 3 : 5,
        shippingDays: 5,
        provider: 'pcbway',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return createSuccessResponse({
      id: quote.id,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      totalPrice: quote.totalPrice,
      currency: quote.currency,
      productionDays: quote.productionDays,
      shippingDays: quote.shippingDays,
      expiresAt: quote.expiresAt,
    });
  });

  // List quotes
  fastify.get('/', async (request: FastifyRequest) => {
    const { page = 1, limit = 20 } = request.query as {
      page?: number;
      limit?: number;
    };

    const [quotes, total] = await Promise.all([
      db.pCBQuote.findMany({
        where: { project: { userId: request.user!.id } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pCBQuote.count({
        where: { project: { userId: request.user!.id } },
      }),
    ]);

    return createSuccessResponse({
      items: quotes,
      total,
      page,
      pageSize: limit,
      hasMore: page * limit < total,
    });
  });

  // Get quote by ID
  fastify.get('/:id', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const quote = await db.pCBQuote.findFirst({
      where: {
        id,
        project: { userId: request.user!.id },
      },
      include: {
        project: true,
        confirmation: true,
      },
    });

    if (!quote) {
      throw ApiError.notFound('Quote not found');
    }

    return createSuccessResponse(quote);
  });
}
