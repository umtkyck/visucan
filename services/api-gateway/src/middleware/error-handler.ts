// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { createErrorResponse } from '@visucan/utils';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send(
      createErrorResponse('VALIDATION_ERROR', 'Validation failed', {
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    );
  }

  // JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply
      .status(401)
      .send(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return reply
      .status(401)
      .send(createErrorResponse('TOKEN_EXPIRED', 'Token has expired'));
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply
      .status(401)
      .send(createErrorResponse('INVALID_TOKEN', 'Invalid token'));
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply
      .status(429)
      .send(
        createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later')
      );
  }

  // Custom API errors
  if ('statusCode' in error && error.statusCode) {
    return reply
      .status(error.statusCode)
      .send(createErrorResponse(error.code || 'ERROR', error.message));
  }

  // Default server error
  return reply
    .status(500)
    .send(createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
}

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new ApiError(400, code, message);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMIT') {
    return new ApiError(429, code, message);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, code, message);
  }
}
