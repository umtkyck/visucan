// ============================================================
// PROJECT ROUTES
// ============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@visucan/database/client';
import { createSuccessResponse, createProjectSchema, getSubscriptionLimits, checkLimit } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

export async function projectRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // List projects
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

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.project.count({ where }),
    ]);

    return createSuccessResponse({
      items: projects.map((p) => ({
        ...p,
        status: p.status.toLowerCase(),
      })),
      total,
      page,
      pageSize: limit,
      hasMore: page * limit < total,
    });
  });

  // Get project by ID
  fastify.get('/:id', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const project = await db.project.findFirst({
      where: { id, userId: request.user!.id },
      include: {
        blockDiagram: true,
        schematic: true,
        pcbLayout: true,
        logoPlacement: true,
        bomItems: {
          include: { component: true },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Update last opened
    await db.project.update({
      where: { id },
      data: { lastOpenedAt: new Date() },
    });

    return createSuccessResponse({
      ...project,
      status: project.status.toLowerCase(),
    });
  });

  // Create project
  fastify.post('/', async (request: FastifyRequest) => {
    const body = createProjectSchema.parse(request.body);
    const user = request.user!;

    // Check project limit
    const limits = getSubscriptionLimits(user.subscription);
    const projectCount = await db.project.count({ where: { userId: user.id } });

    if (!checkLimit(projectCount, limits.maxProjects)) {
      throw ApiError.forbidden(
        `You've reached your project limit (${limits.maxProjects}). Upgrade to Pro for unlimited projects.`,
        'PROJECT_LIMIT_REACHED'
      );
    }

    // Check board size limit
    if (body.boardWidth > limits.maxBoardWidth || body.boardHeight > limits.maxBoardHeight) {
      throw ApiError.forbidden(
        `Board size exceeds your subscription limit (max ${limits.maxBoardWidth}x${limits.maxBoardHeight}mm)`,
        'BOARD_SIZE_LIMIT'
      );
    }

    // Check layer limit
    if (body.layerCount > limits.maxLayers) {
      throw ApiError.forbidden(
        `Layer count exceeds your subscription limit (max ${limits.maxLayers} layers)`,
        'LAYER_LIMIT'
      );
    }

    const project = await db.project.create({
      data: {
        userId: user.id,
        name: body.name,
        description: body.description,
        boardWidth: body.boardWidth,
        boardHeight: body.boardHeight,
        layerCount: body.layerCount,
        status: 'DRAFT',
      },
    });

    // Create empty block diagram
    await db.blockDiagram.create({
      data: { projectId: project.id },
    });

    return createSuccessResponse({
      ...project,
      status: project.status.toLowerCase(),
    });
  });

  // Update project
  fastify.patch('/:id', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(['draft', 'in_progress', 'completed', 'archived']).optional(),
        boardWidth: z.number().positive().optional(),
        boardHeight: z.number().positive().optional(),
        layerCount: z.number().int().min(1).max(4).optional(),
      })
      .parse(request.body);

    // Check ownership
    const existing = await db.project.findFirst({
      where: { id, userId: request.user!.id },
    });

    if (!existing) {
      throw ApiError.notFound('Project not found');
    }

    // Check limits for size/layer updates
    if (body.boardWidth || body.boardHeight || body.layerCount) {
      const limits = getSubscriptionLimits(request.user!.subscription);
      const newWidth = body.boardWidth ?? existing.boardWidth;
      const newHeight = body.boardHeight ?? existing.boardHeight;
      const newLayers = body.layerCount ?? existing.layerCount;

      if (newWidth > limits.maxBoardWidth || newHeight > limits.maxBoardHeight) {
        throw ApiError.forbidden('Board size exceeds subscription limit');
      }
      if (newLayers > limits.maxLayers) {
        throw ApiError.forbidden('Layer count exceeds subscription limit');
      }
    }

    const project = await db.project.update({
      where: { id },
      data: {
        ...body,
        status: body.status?.toUpperCase() as any,
      },
    });

    return createSuccessResponse({
      ...project,
      status: project.status.toLowerCase(),
    });
  });

  // Delete project
  fastify.delete('/:id', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const project = await db.project.findFirst({
      where: { id, userId: request.user!.id },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    await db.project.delete({ where: { id } });

    return createSuccessResponse({ message: 'Project deleted' });
  });

  // Duplicate project
  fastify.post('/:id/duplicate', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const user = request.user!;

    // Check project limit
    const limits = getSubscriptionLimits(user.subscription);
    const projectCount = await db.project.count({ where: { userId: user.id } });

    if (!checkLimit(projectCount, limits.maxProjects)) {
      throw ApiError.forbidden('Project limit reached');
    }

    // Get original project with all data
    const original = await db.project.findFirst({
      where: { id, userId: user.id },
      include: {
        blockDiagram: true,
        schematic: true,
        pcbLayout: true,
      },
    });

    if (!original) {
      throw ApiError.notFound('Project not found');
    }

    // Create duplicate
    const duplicate = await db.project.create({
      data: {
        userId: user.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        boardWidth: original.boardWidth,
        boardHeight: original.boardHeight,
        layerCount: original.layerCount,
        status: 'DRAFT',
      },
    });

    // Duplicate related data
    if (original.blockDiagram) {
      await db.blockDiagram.create({
        data: {
          projectId: duplicate.id,
          blocks: original.blockDiagram.blocks as Prisma.InputJsonValue,
          connections: original.blockDiagram.connections as Prisma.InputJsonValue,
        },
      });
    }

    if (original.schematic) {
      await db.schematic.create({
        data: {
          projectId: duplicate.id,
          data: original.schematic.data as Prisma.InputJsonValue,
          sheets: original.schematic.sheets as Prisma.InputJsonValue,
        },
      });
    }

    if (original.pcbLayout) {
      await db.pCBLayout.create({
        data: {
          projectId: duplicate.id,
          data: original.pcbLayout.data as Prisma.InputJsonValue,
          layerStack: original.pcbLayout.layerStack as Prisma.InputJsonValue,
        },
      });
    }

    return createSuccessResponse({
      ...duplicate,
      status: duplicate.status.toLowerCase(),
    });
  });

  // Update block diagram
  fastify.put('/:id/block-diagram', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        blocks: z.array(z.any()),
        connections: z.array(z.any()),
      })
      .parse(request.body);

    // Check ownership
    const project = await db.project.findFirst({
      where: { id, userId: request.user!.id },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const blockDiagram = await db.blockDiagram.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        blocks: body.blocks,
        connections: body.connections,
      },
      update: {
        blocks: body.blocks,
        connections: body.connections,
      },
    });

    return createSuccessResponse(blockDiagram);
  });

  // Logo placement routes
  fastify.post('/:id/logo', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const user = request.user!;

    // Check feature access
    const limits = getSubscriptionLimits(user.subscription);
    if (!limits.logoPlacement) {
      throw ApiError.forbidden('Logo placement requires Pro or Enterprise subscription');
    }

    // Check ownership
    const project = await db.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Handle file upload
    const data = await request.file();
    if (!data) {
      throw ApiError.badRequest('No file uploaded');
    }

    // TODO: Upload to S3 and get URL
    const fileUrl = `https://placeholder.s3.amazonaws.com/logos/${id}/${data.filename}`;

    const body = z
      .object({
        layer: z.enum(['top_silk', 'bottom_silk', 'top_copper', 'bottom_copper']),
        positionX: z.number(),
        positionY: z.number(),
        width: z.number().positive(),
        height: z.number().positive(),
        rotation: z.number().default(0),
      })
      .parse(Object.fromEntries(data.fields as any));

    const logo = await db.logoPlacement.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        fileUrl,
        fileType: data.mimetype.split('/')[1] || 'png',
        layer: body.layer,
        positionX: body.positionX,
        positionY: body.positionY,
        width: body.width,
        height: body.height,
        rotation: body.rotation,
      },
      update: {
        fileUrl,
        fileType: data.mimetype.split('/')[1] || 'png',
        layer: body.layer,
        positionX: body.positionX,
        positionY: body.positionY,
        width: body.width,
        height: body.height,
        rotation: body.rotation,
      },
    });

    return createSuccessResponse(logo);
  });

  fastify.get('/:id/logo', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const logo = await db.logoPlacement.findFirst({
      where: {
        projectId: id,
        project: { userId: request.user!.id },
      },
    });

    if (!logo) {
      throw ApiError.notFound('No logo found');
    }

    return createSuccessResponse(logo);
  });

  fastify.delete('/:id/logo', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const logo = await db.logoPlacement.findFirst({
      where: {
        projectId: id,
        project: { userId: request.user!.id },
      },
    });

    if (!logo) {
      throw ApiError.notFound('No logo found');
    }

    await db.logoPlacement.delete({ where: { id: logo.id } });

    return createSuccessResponse({ message: 'Logo deleted' });
  });
}
