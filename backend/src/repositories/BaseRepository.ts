import { PoolClient } from 'pg';
import { query, getClient, transaction } from '@/config/database';
import { EntityId, CreateInput, UpdateInput, ServiceResult } from '@/types/common';

/**
 * Base Repository class with PostgreSQL implementation
 * Provides common CRUD operations for all entities
 */
export abstract class BaseRepository<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;

  /**
   * Find entity by ID
   */
  async findById(id: EntityId): Promise<T | null> {
    try {
      const result = await query<T>(
        `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw this.handleDatabaseError(error, 'findById');
    }
  }

  /**
   * Find all entities with optional pagination
   */
  async findAll(limit?: number, offset?: number): Promise<T[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName} ORDER BY ${this.primaryKey}`;
      const params: any[] = [];

      if (limit !== undefined) {
        sql += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }

      if (offset !== undefined) {
        sql += ` OFFSET $${params.length + 1}`;
        params.push(offset);
      }

      const result = await query<T>(sql, params);
      return result.rows;
    } catch (error) {
      throw this.handleDatabaseError(error, 'findAll');
    }
  }

  /**
   * Create new entity
   */
  async create(data: CreateInput<T>): Promise<T> {
    try {
      const { columns, values, placeholders } = this.buildInsertQuery(data);
      
      const sql = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await query<T>(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Failed to create entity in ${this.tableName}`);
      }

      return result.rows[0];
    } catch (error) {
      throw this.handleDatabaseError(error, 'create');
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: EntityId, data: UpdateInput<T>): Promise<T | null> {
    try {
      const { setClause, values } = this.buildUpdateQuery(data);
      
      if (setClause.length === 0) {
        throw new Error('No fields to update');
      }

      const sql = `
        UPDATE ${this.tableName}
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE ${this.primaryKey} = $${values.length + 1}
        RETURNING *
      `;

      values.push(id);
      const result = await query<T>(sql, values);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw this.handleDatabaseError(error, 'update');
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: EntityId): Promise<boolean> {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw this.handleDatabaseError(error, 'delete');
    }
  }

  /**
   * Count total entities
   */
  async count(): Promise<number> {
    try {
      const result = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw this.handleDatabaseError(error, 'count');
    }
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: EntityId): Promise<boolean> {
    try {
      const result = await query<{ exists: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE ${this.primaryKey} = $1) as exists`,
        [id]
      );
      
      return result.rows[0].exists;
    } catch (error) {
      throw this.handleDatabaseError(error, 'exists');
    }
  }

  /**
   * Execute custom query
   */
  protected async executeQuery<R = any>(
    sql: string,
    params?: any[]
  ): Promise<{ rows: R[]; rowCount: number }> {
    try {
      return await query<R>(sql, params);
    } catch (error) {
      throw this.handleDatabaseError(error, 'executeQuery');
    }
  }

  /**
   * Execute queries in transaction
   */
  protected async executeTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    try {
      return await transaction(callback);
    } catch (error) {
      throw this.handleDatabaseError(error, 'executeTransaction');
    }
  }

  /**
   * Build INSERT query from data
   */
  private buildInsertQuery(data: any): {
    columns: string[];
    values: any[];
    placeholders: string[];
  } {
    const columns = Object.keys(data).filter(key => data[key] !== undefined);
    const values = columns.map(key => data[key]);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    return { columns, values, placeholders };
  }

  /**
   * Build UPDATE SET clause from data
   */
  private buildUpdateQuery(data: any): {
    setClause: string[];
    values: any[];
  } {
    const setClause: string[] = [];
    const values: any[] = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id') {
        setClause.push(`${key} = $${values.length + 1}`);
        values.push(data[key]);
      }
    });

    return { setClause, values };
  }

  /**
   * Handle database errors consistently
   */
  private handleDatabaseError(error: any, operation: string): Error {
    console.error(`Database error in ${this.tableName}.${operation}:`, error);

    // PostgreSQL specific error handling
    if (error.code) {
      switch (error.code) {
        case '23505': // unique_violation
          return new Error(`Duplicate entry in ${this.tableName}`);
        case '23503': // foreign_key_violation
          return new Error(`Foreign key constraint violation in ${this.tableName}`);
        case '23514': // check_violation
          return new Error(`Check constraint violation in ${this.tableName}`);
        case '42P01': // undefined_table
          return new Error(`Table ${this.tableName} does not exist`);
        default:
          return new Error(`Database error in ${this.tableName}: ${error.message}`);
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Profile-aware base repository
 * Automatically filters by profile_id for profile-specific entities
 */
export abstract class ProfileAwareRepository<T> extends BaseRepository<T> {
  /**
   * Find entities by profile ID
   */
  async findByProfileId(profileId: number, limit?: number, offset?: number): Promise<T[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName} WHERE profile_id = $1 ORDER BY ${this.primaryKey}`;
      const params: any[] = [profileId];

      if (limit !== undefined) {
        sql += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }

      if (offset !== undefined) {
        sql += ` OFFSET $${params.length + 1}`;
        params.push(offset);
      }

      const result = await query<T>(sql, params);
      return result.rows;
    } catch (error) {
      throw this.handleDatabaseError(error, 'findByProfileId');
    }
  }

  /**
   * Count entities by profile ID
   */
  async countByProfileId(profileId: number): Promise<number> {
    try {
      const result = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE profile_id = $1`,
        [profileId]
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw this.handleDatabaseError(error, 'countByProfileId');
    }
  }

  /**
   * Override create to ensure profile_id is set
   */
  async create(data: CreateInput<T> & { profile_id: number }): Promise<T> {
    if (!data.profile_id) {
      throw new Error('profile_id is required for profile-aware entities');
    }
    
    return super.create(data);
  }

  private handleDatabaseError(error: any, operation: string): Error {
    console.error(`Database error in ${this.tableName}.${operation}:`, error);
    return error instanceof Error ? error : new Error(String(error));
  }
}