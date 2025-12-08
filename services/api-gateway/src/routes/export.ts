// ============================================================
// EXPORT & REPORT ROUTES
// ============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createSuccessResponse, getSubscriptionLimits } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';
import { db } from '@visucan/database/client';

export async function exportRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Export Gerber files
  fastify.get('/projects/:projectId/gerber', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const project = await db.project.findFirst({
      where: { id: projectId, userId: request.user!.id },
      include: { pcbLayout: true },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (!project.pcbLayout) {
      throw ApiError.badRequest('No PCB layout data available');
    }

    // TODO: Generate actual Gerber files
    // For now, return placeholder response

    return createSuccessResponse({
      message: 'Gerber generation initiated',
      downloadUrl: `https://api.visucan.io/downloads/${projectId}/gerber.zip`,
      files: [
        'Top Copper (GTL)',
        'Bottom Copper (GBL)',
        'Top Solder Mask (GTS)',
        'Bottom Solder Mask (GBS)',
        'Top Silkscreen (GTO)',
        'Bottom Silkscreen (GBO)',
        'Drill File (DRL)',
        'Board Outline (GKO)',
      ],
    });
  });

  // Export BOM
  fastify.get('/projects/:projectId/bom', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    const { format = 'csv' } = request.query as { format?: 'csv' | 'xlsx' };

    const user = request.user!;
    const limits = getSubscriptionLimits(user.subscription);

    if (format === 'xlsx' && !limits.exportFormats.includes('bom')) {
      throw ApiError.forbidden('Excel export requires Pro or Enterprise subscription');
    }

    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      include: {
        bomItems: {
          include: { component: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Generate BOM data
    const bomData = project.bomItems.map((item, index) => ({
      item: index + 1,
      quantity: item.quantity,
      designators: item.designators.join(', '),
      manufacturerPN: item.component.manufacturerPartNumber,
      manufacturer: item.component.manufacturer,
      description: item.component.description,
      digikeyPN: item.component.digikeyPartNumber || '',
      unitPrice: item.component.unitPrice,
      extendedPrice: item.component.unitPrice * item.quantity,
      dnp: item.dnp ? 'Yes' : 'No',
      notes: item.notes || '',
    }));

    const totalCost = bomData.reduce((sum, item) => sum + item.extendedPrice, 0);

    return createSuccessResponse({
      projectName: project.name,
      generatedAt: new Date().toISOString(),
      totalItems: bomData.length,
      totalCost,
      currency: 'USD',
      items: bomData,
      downloadUrl: `https://api.visucan.io/downloads/${projectId}/bom.${format}`,
    });
  });

  // Export Pick & Place
  fastify.get('/projects/:projectId/pickplace', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };

    const user = request.user!;
    const limits = getSubscriptionLimits(user.subscription);

    if (!limits.exportFormats.includes('pickplace')) {
      throw ApiError.forbidden('Pick & Place export requires Pro or Enterprise subscription');
    }

    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      include: { pcbLayout: true },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // TODO: Generate actual pick & place file
    return createSuccessResponse({
      message: 'Pick & Place file generation initiated',
      downloadUrl: `https://api.visucan.io/downloads/${projectId}/pickplace.csv`,
    });
  });

  // Generate Draftsman Report
  fastify.post('/projects/:projectId/reports', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    const { type } = z
      .object({
        type: z.enum([
          'assembly_drawing',
          'fabrication_drawing',
          'bom_report',
          'schematic_print',
          'drill_chart',
          'layer_stack',
        ]),
      })
      .parse(request.body);

    const user = request.user!;
    const limits = getSubscriptionLimits(user.subscription);

    // Check draftsman access
    if (limits.draftsman === 'basic') {
      const basicReports = ['bom_report', 'schematic_print'];
      if (!basicReports.includes(type)) {
        throw ApiError.forbidden('This report type requires Pro or Enterprise subscription');
      }
    }

    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // TODO: Generate actual Draftsman report
    const reportTitles: Record<string, string> = {
      assembly_drawing: 'Assembly Drawing',
      fabrication_drawing: 'Fabrication Drawing',
      bom_report: 'Bill of Materials',
      schematic_print: 'Schematic Print',
      drill_chart: 'Drill Chart',
      layer_stack: 'Layer Stack',
    };

    const report = await db.draftsmanReport.create({
      data: {
        projectId,
        type: type.toUpperCase().replace('_', '_') as any,
        title: `${project.name} - ${reportTitles[type]}`,
        fileUrl: `https://api.visucan.io/downloads/${projectId}/reports/${type}.pdf`,
        format: 'pdf',
      },
    });

    return createSuccessResponse({
      id: report.id,
      type: report.type.toLowerCase(),
      title: report.title,
      fileUrl: report.fileUrl,
      format: report.format,
      generatedAt: report.generatedAt,
    });
  });

  // List reports for project
  fastify.get('/projects/:projectId/reports', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };

    const reports = await db.draftsmanReport.findMany({
      where: {
        projectId,
        project: { userId: request.user!.id },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return createSuccessResponse({
      items: reports.map((r) => ({
        ...r,
        type: r.type.toLowerCase(),
      })),
    });
  });

  // Delete report
  fastify.delete('/projects/:projectId/reports/:reportId', async (request: FastifyRequest) => {
    const { projectId, reportId } = request.params as { projectId: string; reportId: string };

    const report = await db.draftsmanReport.findFirst({
      where: {
        id: reportId,
        projectId,
        project: { userId: request.user!.id },
      },
    });

    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    await db.draftsmanReport.delete({ where: { id: reportId } });

    return createSuccessResponse({ message: 'Report deleted' });
  });
}
