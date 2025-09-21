import { ServiceResult, HealthCheckResponse } from '@/types/common';
import { config } from '@/config/environment';
import { createError } from '@/middleware/errorHandler';

/**
 * Health Service
 * Implements health checking business logic following Clean Architecture
 */
export class HealthService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get basic health status
   */
  public async getBasicHealth(): Promise<ServiceResult<HealthCheckResponse>> {
    try {
      const healthData: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: this.getUptime(),
        environment: config.server.nodeEnv,
      };

      return {
        success: true,
        data: healthData,
      };
    } catch (error) {
      return {
        success: false,
        error: createError.internal('Health check failed'),
      };
    }
  }

  /**
   * Get detailed health status including service checks
   */
  public async getDetailedHealth(): Promise<ServiceResult<HealthCheckResponse>> {
    try {
      const serviceStatuses = await this.checkServices();
      const overallStatus = this.determineOverallStatus(serviceStatuses);

      const healthData: HealthCheckResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: this.getUptime(),
        environment: config.server.nodeEnv,
        services: serviceStatuses,
      };

      return {
        success: true,
        data: healthData,
      };
    } catch (error) {
      return {
        success: false,
        error: createError.internal('Detailed health check failed'),
      };
    }
  }

  /**
   * Get readiness status - checks if service is ready to accept traffic
   */
  public async getReadinessStatus(): Promise<ServiceResult<HealthCheckResponse>> {
    try {
      const serviceStatuses = await this.checkCriticalServices();
      const isReady = this.areAllCriticalServicesHealthy(serviceStatuses);

      const healthData: HealthCheckResponse = {
        status: isReady ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: this.getUptime(),
        environment: config.server.nodeEnv,
        services: serviceStatuses,
      };

      if (!isReady) {
        return {
          success: false,
          error: createError.internal('Service not ready - critical dependencies unavailable'),
        };
      }

      return {
        success: true,
        data: healthData,
      };
    } catch (error) {
      return {
        success: false,
        error: createError.internal('Readiness check failed'),
      };
    }
  }

  /**
   * Get liveness status - checks if service is alive and should be restarted if not
   */
  public async getLivenessStatus(): Promise<ServiceResult<HealthCheckResponse>> {
    try {
      // Basic liveness checks
      const memoryUsage = process.memoryUsage();
      const isMemoryHealthy = this.checkMemoryUsage(memoryUsage);
      const isUptimeHealthy = this.checkUptime();

      const status = isMemoryHealthy && isUptimeHealthy ? 'healthy' : 'unhealthy';

      const healthData: HealthCheckResponse = {
        status,
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: this.getUptime(),
        environment: config.server.nodeEnv,
      };

      return {
        success: true,
        data: healthData,
      };
    } catch (error) {
      return {
        success: false,
        error: createError.internal('Liveness check failed'),
      };
    }
  }

  /**
   * Check all services status
   */
  private async checkServices(): Promise<Record<string, 'connected' | 'disconnected'>> {
    const services: Record<string, 'connected' | 'disconnected'> = {};

    // Database check (placeholder - will be implemented when DB is added)
    services['database'] = await this.checkDatabase();

    // Redis check (placeholder - will be implemented if Redis is added)
    // services.redis = await this.checkRedis();

    return services;
  }

  /**
   * Check critical services for readiness
   */
  private async checkCriticalServices(): Promise<Record<string, 'connected' | 'disconnected'>> {
    const services: Record<string, 'connected' | 'disconnected'> = {};

    // Only check critical services that must be available for the service to work
    services['database'] = await this.checkDatabase();

    return services;
  }

  /**
   * Check database connectivity (placeholder)
   */
  private async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      // TODO: Implement actual database health check when DB is added
      // For now, always return connected since we don't have a DB yet
      return 'connected';
    } catch (error) {
      console.error('Database health check failed:', error);
      return 'disconnected';
    }
  }

  /**
   * Determine overall health status based on service statuses
   */
  private determineOverallStatus(
    services: Record<string, 'connected' | 'disconnected'>
  ): 'healthy' | 'unhealthy' {
    const hasUnhealthyServices = Object.values(services).some(status => status === 'disconnected');
    return hasUnhealthyServices ? 'unhealthy' : 'healthy';
  }

  /**
   * Check if all critical services are healthy
   */
  private areAllCriticalServicesHealthy(
    services: Record<string, 'connected' | 'disconnected'>
  ): boolean {
    return Object.values(services).every(status => status === 'connected');
  }

  /**
   * Check memory usage health
   */
  private checkMemoryUsage(memoryUsage: NodeJS.MemoryUsage): boolean {
    const maxMemoryMB = 512; // 512MB threshold
    const currentMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
    return currentMemoryMB < maxMemoryMB;
  }

  /**
   * Check uptime health (detect if service has been running too long)
   */
  private checkUptime(): boolean {
    const maxUptimeHours = 24 * 7; // 1 week
    const currentUptimeHours = this.getUptime() / 3600;
    return currentUptimeHours < maxUptimeHours;
  }

  /**
   * Get service uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}