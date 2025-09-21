// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: Record<string, any>;
}

// Request/Response interfaces
export interface BaseRequest {
  timestamp: Date;
  requestId: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  services?: {
    database?: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
  };
}

// Domain types placeholders (to be expanded later)
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  description?: string;
  instructions?: string[];
  muscleGroups: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  userId: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

// Utility types
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<CreateInput<T>>;
export type EntityId = string;

// Service response types
export type ServiceResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiError;
};

// Repository interfaces
export interface BaseRepository<T> {
  findById(id: EntityId): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: CreateInput<T>): Promise<T>;
  update(id: EntityId, data: UpdateInput<T>): Promise<T | null>;
  delete(id: EntityId): Promise<boolean>;
}

// Service interfaces
export interface BaseService<T> {
  getById(id: EntityId): Promise<ServiceResult<T>>;
  getAll(): Promise<ServiceResult<T[]>>;
  create(data: CreateInput<T>): Promise<ServiceResult<T>>;
  update(id: EntityId, data: UpdateInput<T>): Promise<ServiceResult<T>>;
  delete(id: EntityId): Promise<ServiceResult<boolean>>;
}