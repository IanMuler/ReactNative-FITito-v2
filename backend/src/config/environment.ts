import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper function to get environment variable with default value
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

// Helper function to get number from environment variable
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
};

// Helper function to get boolean from environment variable
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Type-safe environment configuration
export const config = {
  server: {
    nodeEnv: getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    port: getEnvNumber('PORT', 3000),
    host: getEnvVar('HOST', 'localhost'),
    get isDevelopment() { return this.nodeEnv === 'development'; },
    get isProduction() { return this.nodeEnv === 'production'; },
    get isTest() { return this.nodeEnv === 'test'; },
  },
  
  api: {
    version: getEnvVar('API_VERSION', 'v1'),
    prefix: getEnvVar('API_PREFIX', '/api'),
    get baseUrl() { return `${this.prefix}/${this.version}`; },
  },
  
  security: {
    jwtSecret: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key-for-development-only'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
  },
  
  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  },
  
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug',
    format: getEnvVar('LOG_FORMAT', 'combined') as 'combined' | 'common' | 'dev' | 'short' | 'tiny',
  },
  
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:8081'),
    credentials: getEnvBoolean('CORS_CREDENTIALS', true),
  },
} as const;

// Export types for type safety
export type Config = typeof config;
export type ServerConfig = typeof config.server;
export type ApiConfig = typeof config.api;
export type SecurityConfig = typeof config.security;