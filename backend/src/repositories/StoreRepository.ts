/**
 * Store Repository
 * Data access layer for Store entities
 */

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { BaseRepository } from './BaseRepository';
import { Store, PaginationParams, PaginatedResult } from '../types';

export class StoreRepository extends BaseRepository<Store> {
  constructor(dynamodb: DynamoDBDocumentClient, tableName: string) {
    super(dynamodb, tableName, 'storeId');
  }

  /**
   * Find stores by user ID using GSI
   */
  async findByUserId(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<Store>> {
    return this.queryByIndex(
      'userId-index',
      '#userId = :userId',
      { '#userId': 'userId' },
      { ':userId': userId },
      params
    );
  }

  /**
   * Find stores by tenant ID
   */
  async findByTenantId(
    tenantId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<Store>> {
    return this.findByField('tenantId', tenantId, params);
  }

  /**
   * Find stores by status
   */
  async findByStatus(
    status: Store['status'],
    params: PaginationParams = {}
  ): Promise<PaginatedResult<Store>> {
    return this.findByField('status', status, params);
  }
}
