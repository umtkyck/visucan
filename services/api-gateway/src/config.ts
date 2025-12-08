// ============================================================
// API GATEWAY CONFIGURATION
// ============================================================

import { getEnvVar, getEnvVarOptional } from '@visucan/utils';

export const config = {
  // Server
  port: parseInt(getEnvVarOptional('PORT') || '3001', 10),
  nodeEnv: getEnvVarOptional('NODE_ENV') || 'development',
  logLevel: getEnvVarOptional('LOG_LEVEL') || 'info',

  // CORS
  corsOrigins: (getEnvVarOptional('CORS_ORIGINS') || 'http://localhost:3000').split(','),

  // Auth
  jwtSecret: getEnvVarOptional('JWT_SECRET') || 'visucan-dev-jwt-secret-change-in-production',
  jwtRefreshSecret: getEnvVarOptional('JWT_REFRESH_SECRET') || 'visucan-dev-refresh-secret-change-in-production',
  cookieSecret: getEnvVarOptional('COOKIE_SECRET') || 'visucan-dev-cookie-secret-change-in-production',

  // Database
  databaseUrl: getEnvVarOptional('DATABASE_URL') || 'postgresql://postgres:postgres@localhost:5432/visucan',

  // Redis
  redisUrl: getEnvVarOptional('REDIS_URL') || 'redis://localhost:6379',

  // External APIs
  anthropicApiKey: getEnvVarOptional('ANTHROPIC_API_KEY') || '',
  digikeyClientId: getEnvVarOptional('DIGIKEY_CLIENT_ID') || '',
  digikeyClientSecret: getEnvVarOptional('DIGIKEY_CLIENT_SECRET') || '',
  pcbwayApiKey: getEnvVarOptional('PCBWAY_API_KEY') || '',

  // Stripe
  stripeSecretKey: getEnvVarOptional('STRIPE_SECRET_KEY') || '',
  stripeWebhookSecret: getEnvVarOptional('STRIPE_WEBHOOK_SECRET') || '',

  // AWS S3
  awsAccessKeyId: getEnvVarOptional('AWS_ACCESS_KEY_ID') || '',
  awsSecretAccessKey: getEnvVarOptional('AWS_SECRET_ACCESS_KEY') || '',
  awsS3Bucket: getEnvVarOptional('AWS_S3_BUCKET') || 'visucan-uploads',
  awsRegion: getEnvVarOptional('AWS_REGION') || 'us-east-1',
};
