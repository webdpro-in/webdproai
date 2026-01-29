/**
 * Base Repository Interface
 * Defines the contract for data access layer
 */

import { PaginationParams, PaginatedResult } from '../types';

export interface Repository<T> {
  create(item: T): Promise<void>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface QueryableRepository<T> extends Repository<T> {
  findAll(params: PaginationParams): Promise<PaginatedResult<T>>;
  findByField(field: string, value: unknown, params?: PaginationParams): Promise<PaginatedResult<T>>;
}
