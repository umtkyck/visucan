// ============================================================
// COMPONENT ROUTES (DIGIKEY INTEGRATION)
// ============================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createSuccessResponse, getSubscriptionLimits, checkLimit } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';
import { db } from '@visucan/database/client';

// TODO: Implement actual DigiKey API integration
// This is a placeholder with mock data

const mockComponents = [
  {
    id: '1',
    digikeyPartNumber: 'ESP32-WROOM-32E-N16',
    manufacturerPartNumber: 'ESP32-WROOM-32E(16MB)',
    manufacturer: 'Espressif Systems',
    description: 'SMD Module ESP32-WROOM-32E, 16 MB flash',
    category: 'RF/IF and RFID',
    unitPrice: 3.15,
    currency: 'USD',
    stock: 15420,
    datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf',
    imageUrl: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/2846/ESP32-WROOM-32E.jpg',
    footprint: 'MODULE_ESP32_WROOM',
  },
  {
    id: '2',
    digikeyPartNumber: 'STM32F411CEU6',
    manufacturerPartNumber: 'STM32F411CEU6',
    manufacturer: 'STMicroelectronics',
    description: 'ARM Cortex-M4 MCU 100MHz 512KB Flash',
    category: 'Integrated Circuits',
    unitPrice: 5.89,
    currency: 'USD',
    stock: 8234,
    datasheetUrl: 'https://www.st.com/resource/en/datasheet/stm32f411ce.pdf',
    imageUrl: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/4893/497%3B48%3B11x11.jpg',
    footprint: 'QFP48',
  },
  {
    id: '3',
    digikeyPartNumber: 'RC0603FR-0710KL',
    manufacturerPartNumber: 'RC0603FR-0710KL',
    manufacturer: 'YAGEO',
    description: 'RES SMD 10K OHM 1% 1/10W 0603',
    category: 'Resistors',
    unitPrice: 0.01,
    currency: 'USD',
    stock: 2500000,
    footprint: '0603',
  },
];

export async function componentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Search components
  fastify.get('/search', async (request: FastifyRequest) => {
    const { query, category, limit = 20 } = request.query as {
      query: string;
      category?: string;
      limit?: number;
    };

    if (!query) {
      throw ApiError.badRequest('Search query is required');
    }

    // Check rate limit for DigiKey searches
    const user = request.user!;
    const limits = getSubscriptionLimits(user.subscription);

    // TODO: Implement actual usage tracking
    // For now, mock the response
    const results = mockComponents.filter((c) => {
      const matchesQuery =
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.manufacturerPartNumber.toLowerCase().includes(query.toLowerCase()) ||
        c.manufacturer.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || c.category === category;
      return matchesQuery && matchesCategory;
    });

    return createSuccessResponse({
      items: results.slice(0, limit),
      total: results.length,
    });
  });

  // Get component by part number
  fastify.get('/:partNumber', async (request: FastifyRequest) => {
    const { partNumber } = request.params as { partNumber: string };

    const component = mockComponents.find(
      (c) =>
        c.digikeyPartNumber === partNumber ||
        c.manufacturerPartNumber === partNumber
    );

    if (!component) {
      throw ApiError.notFound('Component not found');
    }

    return createSuccessResponse(component);
  });

  // Compare components
  fastify.post('/compare', async (request: FastifyRequest) => {
    const { partNumbers } = z
      .object({
        partNumbers: z.array(z.string()).min(2).max(5),
      })
      .parse(request.body);

    const components = mockComponents.filter(
      (c) =>
        partNumbers.includes(c.digikeyPartNumber!) ||
        partNumbers.includes(c.manufacturerPartNumber)
    );

    if (components.length === 0) {
      throw ApiError.notFound('No components found');
    }

    return createSuccessResponse({
      components,
      comparison: {
        priceRange: {
          min: Math.min(...components.map((c) => c.unitPrice)),
          max: Math.max(...components.map((c) => c.unitPrice)),
        },
        totalStock: components.reduce((sum, c) => sum + c.stock, 0),
      },
    });
  });

  // Get component categories
  fastify.get('/categories', async () => {
    const categories = [
      { id: 'resistors', name: 'Resistors', count: 1500000 },
      { id: 'capacitors', name: 'Capacitors', count: 1200000 },
      { id: 'inductors', name: 'Inductors', count: 450000 },
      { id: 'integrated_circuits', name: 'Integrated Circuits', count: 890000 },
      { id: 'connectors', name: 'Connectors', count: 670000 },
      { id: 'sensors', name: 'Sensors', count: 125000 },
      { id: 'rf_if', name: 'RF/IF and RFID', count: 85000 },
      { id: 'power_management', name: 'Power Management', count: 340000 },
      { id: 'discrete_semiconductors', name: 'Discrete Semiconductors', count: 780000 },
      { id: 'optoelectronics', name: 'Optoelectronics', count: 290000 },
    ];

    return createSuccessResponse(categories);
  });

  // Add component to project BOM
  fastify.post('/:projectId/bom', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    const body = z
      .object({
        componentId: z.string(),
        quantity: z.number().int().positive(),
        designators: z.array(z.string()),
        dnp: z.boolean().default(false),
        notes: z.string().optional(),
      })
      .parse(request.body);

    // Check project ownership
    const project = await db.project.findFirst({
      where: { id: projectId, userId: request.user!.id },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Find or create component in DB
    let component = await db.component.findUnique({
      where: { id: body.componentId },
    });

    if (!component) {
      // Find in mock data
      const mockComponent = mockComponents.find((c) => c.id === body.componentId);
      if (!mockComponent) {
        throw ApiError.notFound('Component not found');
      }

      component = await db.component.create({
        data: {
          digikeyPartNumber: mockComponent.digikeyPartNumber,
          manufacturerPartNumber: mockComponent.manufacturerPartNumber,
          manufacturer: mockComponent.manufacturer,
          description: mockComponent.description,
          category: mockComponent.category,
          unitPrice: mockComponent.unitPrice,
          currency: mockComponent.currency,
          stock: mockComponent.stock,
          datasheetUrl: mockComponent.datasheetUrl,
          imageUrl: mockComponent.imageUrl,
          footprint: mockComponent.footprint,
        },
      });
    }

    // Add to BOM
    const bomItem = await db.bOMItem.create({
      data: {
        projectId,
        componentId: component.id,
        quantity: body.quantity,
        designators: body.designators,
        dnp: body.dnp,
        notes: body.notes,
      },
      include: { component: true },
    });

    return createSuccessResponse(bomItem);
  });
}
