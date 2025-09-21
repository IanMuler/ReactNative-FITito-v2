import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { HealthService } from '@/services/HealthService';
import { HealthCheckResponse } from '@/types/common';

/**
 * Health Controller
 * Handles health check endpoints following Clean Architecture
 */
export class HealthController extends BaseController {
  private healthService: HealthService;

  constructor(healthService: HealthService) {
    super();
    this.healthService = healthService;
  }

  /**
   * GET /health - Basic health check
   */
  public basicHealthCheck = this.wrap(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.healthService.getBasicHealth();
    this.handleServiceResult(res, result);
  });

  /**
   * GET /health/detailed - Detailed health check with service status
   */
  public detailedHealthCheck = this.wrap(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.healthService.getDetailedHealth();
    this.handleServiceResult(res, result);
  });

  /**
   * GET /health/readiness - Readiness probe for Kubernetes
   */
  public readinessCheck = this.wrap(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.healthService.getReadinessStatus();
    
    if (result.success) {
      const healthData = result.data as HealthCheckResponse;
      const statusCode = healthData.status === 'healthy' ? 200 : 503;
      this.sendSuccess(res, result.data, 'Readiness check completed', statusCode);
    } else {
      // Send 503 Service Unavailable for readiness failures
      res.status(503).json({
        success: false,
        error: result.error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /health/liveness - Liveness probe for Kubernetes
   */
  public livenessCheck = this.wrap(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.healthService.getLivenessStatus();
    this.handleServiceResult(res, result);
  });
}