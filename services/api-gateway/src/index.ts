// ============================================================
// VISUCAN API GATEWAY
// Main entry point for the API server
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import { authRoutes } from './routes/auth';
import { projectRoutes } from './routes/projects';
import { componentRoutes } from './routes/components';
import { quoteRoutes } from './routes/quotes';
import { orderRoutes } from './routes/orders';
import { marketplaceRoutes } from './routes/marketplace';
import { chatRoutes } from './routes/chat';
import { exportRoutes } from './routes/export';
import { errorHandler } from './middleware/error-handler';
import { config } from './config';

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport:
      config.nodeEnv === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
  },
});

async function buildApp() {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: config.nodeEnv === 'production',
  });

  await fastify.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for']?.toString() || request.ip;
    },
  });

  // Auth
  await fastify.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: '15m',
    },
  });

  await fastify.register(cookie, {
    secret: config.cookieSecret,
  });

  // File uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // API Documentation
  if (config.nodeEnv !== 'production') {
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'VisuCAN API',
          description: 'AI-Powered PCB Design Platform API',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    });

    await fastify.register(swaggerUI, {
      routePrefix: '/docs',
    });
  }

  // Error handling
  fastify.setErrorHandler(errorHandler);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API Routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(projectRoutes, { prefix: '/api/v1/projects' });
  await fastify.register(componentRoutes, { prefix: '/api/v1/components' });
  await fastify.register(quoteRoutes, { prefix: '/api/v1/quotes' });
  await fastify.register(orderRoutes, { prefix: '/api/v1/orders' });
  await fastify.register(marketplaceRoutes, { prefix: '/api/v1/marketplace' });
  await fastify.register(chatRoutes, { prefix: '/api/v1/chat' });
  await fastify.register(exportRoutes, { prefix: '/api/v1/export' });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: config.port, host: '0.0.0.0' });

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   VisuCAN API Gateway                                      ║
║   Running on http://localhost:${config.port}                      ║
║   Docs: http://localhost:${config.port}/docs                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

export { buildApp };
