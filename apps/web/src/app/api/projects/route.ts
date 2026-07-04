import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@visucan/database/client';
import {
  createProjectSchema,
  createSuccessResponse,
  createErrorResponse,
  getSubscriptionLimits,
  checkLimit,
} from '@visucan/utils';
import { withAuth } from '@/lib/auth';
import {
  PROJECT_STATUS_TO_DB,
  serializeProject,
  toSubscriptionTier,
} from '@/lib/projects';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']).optional(),
});

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const query = listQuerySchema.safeParse(
        Object.fromEntries(req.nextUrl.searchParams)
      );

      if (!query.success) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', {
            errors: query.error.errors,
          }),
          { status: 400 }
        );
      }

      const { page, limit, status } = query.data;

      const where = {
        userId: user.id,
        ...(status && { status: PROJECT_STATUS_TO_DB[status] }),
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

      return NextResponse.json(
        createSuccessResponse({
          items: projects.map(serializeProject),
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total,
        })
      );
    } catch (error) {
      console.error('List projects error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to list projects'),
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const validated = createProjectSchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
            errors: validated.error.errors,
          }),
          { status: 400 }
        );
      }

      const data = validated.data;
      const limits = getSubscriptionLimits(toSubscriptionTier(user.subscription));

      const projectCount = await db.project.count({
        where: { userId: user.id },
      });

      if (!checkLimit(projectCount, limits.maxProjects)) {
        return NextResponse.json(
          createErrorResponse(
            'PROJECT_LIMIT_REACHED',
            `You've reached your project limit (${limits.maxProjects}). Upgrade to Pro for unlimited projects.`
          ),
          { status: 403 }
        );
      }

      if (
        data.boardWidth > limits.maxBoardWidth ||
        data.boardHeight > limits.maxBoardHeight
      ) {
        return NextResponse.json(
          createErrorResponse(
            'BOARD_SIZE_LIMIT',
            `Board size exceeds your subscription limit (max ${limits.maxBoardWidth}x${limits.maxBoardHeight}mm)`
          ),
          { status: 403 }
        );
      }

      if (data.layerCount > limits.maxLayers) {
        return NextResponse.json(
          createErrorResponse(
            'LAYER_LIMIT',
            `Layer count exceeds your subscription limit (max ${limits.maxLayers} layers)`
          ),
          { status: 403 }
        );
      }

      const project = await db.project.create({
        data: {
          userId: user.id,
          name: data.name,
          description: data.description,
          boardWidth: data.boardWidth,
          boardHeight: data.boardHeight,
          layerCount: data.layerCount,
          status: 'DRAFT',
        },
      });

      await db.blockDiagram.create({
        data: { projectId: project.id },
      });

      return NextResponse.json(createSuccessResponse(serializeProject(project)), {
        status: 201,
      });
    } catch (error) {
      console.error('Create project error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create project'),
        { status: 500 }
      );
    }
  });
}
