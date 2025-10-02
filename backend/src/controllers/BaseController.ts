import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ServiceResult } from '@/types/common';
import { asyncHandler } from '@/middleware/asyncHandler';

/**
 * Base Controller class implementing common functionality
 * Following Clean Architecture principles
 */
export abstract class BaseController {
  /**
   * Send success response with data
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send success response without data
   */
  protected sendSuccessMessage(
    res: Response,
    message: string,
    statusCode: number = 200
  ): void {
    const response: ApiResponse = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
  }

  /**
   * Handle service result and send appropriate response
   */
  protected handleServiceResult<T>(
    res: Response,
    result: ServiceResult<T>,
    successMessage?: string,
    successStatusCode: number = 200
  ): void {
    if (result.success) {
      this.sendSuccess(res, result.data, successMessage, successStatusCode);
    } else {
      // Error will be handled by error middleware
      throw result.error;
    }
  }

  /**
   * Extract pagination parameters from request
   */
  protected getPaginationParams(req: Request): { page: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Extract search parameters from request
   */
  protected getSearchParams(req: Request): { search?: string } {
    const searchQuery = req.query['search'] as string;
    return searchQuery ? { search: searchQuery } : {};
  }

  /**
   * Wrap controller method with async error handling
   */
  protected wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return asyncHandler(fn.bind(this));
  }
}

/**
 * Base CRUD Controller providing standard REST operations
 */
export abstract class BaseCrudController<T> extends BaseController {
  /**
   * GET /resource - Get all resources
   */
  public getAll = this.wrap(async (req: Request, res: Response): Promise<void> => {
    const pagination = this.getPaginationParams(req);
    const search = this.getSearchParams(req);
    
    const result = await this.getAllService(pagination, search);
    this.handleServiceResult(res, result);
  });

  /**
   * GET /resource/:id - Get resource by ID
   */
  public getById = this.wrap(async (req: Request, res: Response): Promise<void> => {
    const id = req.params['id'];
    if (!id) throw new Error('ID parameter is required');
    
    const result = await this.getByIdService(id);
    this.handleServiceResult(res, result);
  });

  /**
   * POST /resource - Create new resource
   */
  public create = this.wrap(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    
    const result = await this.createService(data);
    this.handleServiceResult(res, result, 'Resource created successfully', 201);
  });

  /**
   * PUT /resource/:id - Update resource
   */
  public update = this.wrap(async (req: Request, res: Response): Promise<void> => {
    const id = req.params['id'];
    if (!id) throw new Error('ID parameter is required');
    const data = req.body;
    
    const result = await this.updateService(id, data);
    this.handleServiceResult(res, result, 'Resource updated successfully');
  });

  /**
   * DELETE /resource/:id - Delete resource
   */
  public delete = this.wrap(async (req: Request, res: Response): Promise<void> => {
    const id = req.params['id'];
    if (!id) throw new Error('ID parameter is required');
    
    const result = await this.deleteService(id);
    
    if (result.success) {
      this.sendSuccessMessage(res, 'Resource deleted successfully', 204);
    } else {
      throw result.error;
    }
  });

  // Abstract methods to be implemented by concrete controllers
  protected abstract getAllService(
    pagination: { page: number; limit: number; offset: number },
    search: { search?: string }
  ): Promise<ServiceResult<T[]>>;

  protected abstract getByIdService(id: string): Promise<ServiceResult<T>>;
  
  protected abstract createService(data: any): Promise<ServiceResult<T>>;
  
  protected abstract updateService(id: string, data: any): Promise<ServiceResult<T>>;
  
  protected abstract deleteService(id: string): Promise<ServiceResult<boolean>>;
}