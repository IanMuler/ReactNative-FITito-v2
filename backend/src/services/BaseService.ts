import { BaseRepository, ServiceResult, CreateInput, UpdateInput, EntityId } from '@/types/common';
import { createError } from '@/middleware/errorHandler';

/**
 * Base Service class implementing common business logic patterns
 * Following Clean Architecture principles - Application Layer
 */
export abstract class BaseService<T> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  /**
   * Get entity by ID with proper error handling
   */
  public async getById(id: EntityId): Promise<ServiceResult<T>> {
    try {
      this.validateId(id);
      
      const entity = await this.repository.findById(id);
      
      if (!entity) {
        return {
          success: false,
          error: createError.notFound(`${this.getEntityName()} not found`),
        };
      }

      return {
        success: true,
        data: entity,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all entities
   */
  public async getAll(): Promise<ServiceResult<T[]>> {
    try {
      const entities = await this.repository.findAll();
      
      return {
        success: true,
        data: entities,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create new entity with validation
   */
  public async create(data: CreateInput<T>): Promise<ServiceResult<T>> {
    try {
      // Validate input data
      await this.validateCreateInput(data);
      
      // Business logic validation
      await this.validateBusinessRules(data);
      
      const entity = await this.repository.create(data);
      
      return {
        success: true,
        data: entity,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update entity with validation
   */
  public async update(id: EntityId, data: UpdateInput<T>): Promise<ServiceResult<T>> {
    try {
      this.validateId(id);
      
      // Check if entity exists
      const existingEntity = await this.repository.findById(id);
      if (!existingEntity) {
        return {
          success: false,
          error: createError.notFound(`${this.getEntityName()} not found`),
        };
      }

      // Validate input data
      await this.validateUpdateInput(data);
      
      // Business logic validation
      await this.validateBusinessRulesForUpdate(id, data, existingEntity);
      
      const updatedEntity = await this.repository.update(id, data);
      
      if (!updatedEntity) {
        return {
          success: false,
          error: createError.internal('Failed to update entity'),
        };
      }

      return {
        success: true,
        data: updatedEntity,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete entity with validation
   */
  public async delete(id: EntityId): Promise<ServiceResult<boolean>> {
    try {
      this.validateId(id);
      
      // Check if entity exists
      const existingEntity = await this.repository.findById(id);
      if (!existingEntity) {
        return {
          success: false,
          error: createError.notFound(`${this.getEntityName()} not found`),
        };
      }

      // Validate deletion rules
      await this.validateDeletionRules(id, existingEntity);
      
      const deleted = await this.repository.delete(id);
      
      return {
        success: true,
        data: deleted,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate ID format
   */
  protected validateId(id: EntityId): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw createError.badRequest('Invalid ID provided');
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any): ServiceResult<any> {
    // If it's already our custom error, return it
    if (error.statusCode && error.message) {
      return {
        success: false,
        error,
      };
    }

    // Log unexpected errors
    console.error(`Unexpected error in ${this.getEntityName()} service:`, error);

    return {
      success: false,
      error: createError.internal(`Internal error in ${this.getEntityName()} service`),
    };
  }

  // Abstract methods to be implemented by concrete services
  protected abstract getEntityName(): string;

  protected abstract validateCreateInput(data: CreateInput<T>): Promise<void>;

  protected abstract validateUpdateInput(data: UpdateInput<T>): Promise<void>;

  protected abstract validateBusinessRules(data: CreateInput<T>): Promise<void>;

  protected abstract validateBusinessRulesForUpdate(
    id: EntityId,
    data: UpdateInput<T>,
    existingEntity: T
  ): Promise<void>;

  protected abstract validateDeletionRules(id: EntityId, entity: T): Promise<void>;
}

/**
 * Extended service with search and pagination capabilities
 */
export abstract class BaseSearchableService<T> extends BaseService<T> {
  /**
   * Search entities with pagination
   */
  public async search(
    query: string,
    pagination: { page: number; limit: number; offset: number }
  ): Promise<ServiceResult<{ data: T[]; total: number; page: number; totalPages: number }>> {
    try {
      if (query && query.trim().length < 2) {
        return {
          success: false,
          error: createError.badRequest('Search query must be at least 2 characters long'),
        };
      }

      const { data, total } = await this.performSearch(query, pagination);
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        success: true,
        data: {
          data,
          total,
          page: pagination.page,
          totalPages,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Abstract method for search implementation
  protected abstract performSearch(
    query: string,
    pagination: { page: number; limit: number; offset: number }
  ): Promise<{ data: T[]; total: number }>;
}