import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@visucan/database/client';
import {
  createSuccessResponse,
  createErrorResponse,
  getSubscriptionLimits,
} from '@visucan/utils';
import { withAuth } from '@/lib/auth';
import {
  PROJECT_STATUS_TO_DB,
  serializeProject,
  toSubscriptionTier,
} from '@/lib/projects';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return withAuth(request, async (_req, user) => {
    try {
      const project = await db.project.findFirst({
        where: { id: params.id, userId: user.id },
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
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'Project not found'),
          { status: 404 }
        );
      }

      await db.project.update({
        where: { id: project.id },
        data: { lastOpenedAt: new Date() },
      });

      return NextResponse.json(createSuccessResponse(serializeProject(project)));
    } catch (error) {
      console.error('Get project error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to get project'),
        { status: 500 }
      );
    }
  });
}

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']).optional(),
  boardWidth: z.number().positive().optional(),
  boardHeight: z.number().positive().optional(),
  layerCount: z.number().int().min(1).max(4).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const validated = updateProjectSchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
            errors: validated.error.errors,
          }),
          { status: 400 }
        );
      }

      const data = validated.data;

      const existing = await db.project.findFirst({
        where: { id: params.id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'Project not found'),
          { status: 404 }
        );
      }

      if (data.boardWidth || data.boardHeight || data.layerCount) {
        const limits = getSubscriptionLimits(
          toSubscriptionTier(user.subscription)
        );
        const newWidth = data.boardWidth ?? existing.boardWidth;
        const newHeight = data.boardHeight ?? existing.boardHeight;
        const newLayers = data.layerCount ?? existing.layerCount;

        if (newWidth > limits.maxBoardWidth || newHeight > limits.maxBoardHeight) {
          return NextResponse.json(
            createErrorResponse(
              'BOARD_SIZE_LIMIT',
              'Board size exceeds subscription limit'
            ),
            { status: 403 }
          );
        }
        if (newLayers > limits.maxLayers) {
          return NextResponse.json(
            createErrorResponse(
              'LAYER_LIMIT',
              'Layer count exceeds subscription limit'
            ),
            { status: 403 }
          );
        }
      }

      const { status, ...rest } = data;
      const project = await db.project.update({
        where: { id: existing.id },
        data: {
          ...rest,
          ...(status && { status: PROJECT_STATUS_TO_DB[status] }),
        },
      });

      return NextResponse.json(createSuccessResponse(serializeProject(project)));
    } catch (error) {
      console.error('Update project error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update project'),
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return withAuth(request, async (_req, user) => {
    try {
      const project = await db.project.findFirst({
        where: { id: params.id, userId: user.id },
      });

      if (!project) {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'Project not found'),
          { status: 404 }
        );
      }

      await db.project.delete({ where: { id: project.id } });

      return NextResponse.json(
        createSuccessResponse({ message: 'Project deleted' })
      );
    } catch (error) {
      console.error('Delete project error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to delete project'),
        { status: 500 }
      );
    }
  });
}
