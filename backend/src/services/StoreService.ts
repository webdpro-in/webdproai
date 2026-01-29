/**
 * Store Service
 * Business logic for store management
 */

import { Store, PaginationParams, PaginatedResult } from '../types';
import { StoreRepository } from '../repositories/StoreRepository';
import { Service, ServiceContext } from '../interfaces/Service';
import { generateStoreId } from '../utils/id-generator';

export interface CreateStoreData {
  businessName: string;
  businessType: string;
  description: string;
  language?: string;
  currency?: string;
}

export class StoreService implements Service {
  constructor(
    private readonly storeRepository: StoreRepository
  ) {}

  async createStore(
    context: ServiceContext,
    data: CreateStoreData
  ): Promise<Store> {
    const now = new Date().toISOString();
    
    const store: Store = {
      storeId: generateStoreId(),
      userId: context.userId,
      tenantId: context.tenantId || context.userId,
      businessName: data.businessName,
      businessType: data.businessType,
      description: data.description,
      status: 'draft',
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
    };

    await this.storeRepository.create(store);
    
    return store;
  }

  async getStore(context: ServiceContext, storeId: string): Promise<Store | null> {
    const store = await this.storeRepository.findById(storeId);
    
    if (!store) {
      return null;
    }

    // Verify ownership
    if (store.userId !== context.userId && store.tenantId !== context.tenantId) {
      throw new Error('Access denied: You do not own this store');
    }

    return store;
  }

  async listStores(
    context: ServiceContext,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<Store>> {
    // List stores for the authenticated user
    return this.storeRepository.findByUserId(context.userId, params);
  }

  async updateStore(
    context: ServiceContext,
    storeId: string,
    updates: Partial<Store>
  ): Promise<Store> {
    // Verify ownership first
    const existingStore = await this.getStore(context, storeId);
    if (!existingStore) {
      throw new Error('Store not found');
    }

    // Prevent updating certain fields
    const allowedUpdates = { ...updates };
    delete allowedUpdates.storeId;
    delete allowedUpdates.userId;
    delete allowedUpdates.tenantId;
    delete allowedUpdates.createdAt;

    // Add updated timestamp
    allowedUpdates.updatedAt = new Date().toISOString();

    await this.storeRepository.update(storeId, allowedUpdates);

    // Return updated store
    return this.getStore(context, storeId) as Promise<Store>;
  }

  async deleteStore(context: ServiceContext, storeId: string): Promise<void> {
    // Verify ownership first
    const existingStore = await this.getStore(context, storeId);
    if (!existingStore) {
      throw new Error('Store not found');
    }

    await this.storeRepository.delete(storeId);
  }

  async updateStoreStatus(
    context: ServiceContext,
    storeId: string,
    status: Store['status']
  ): Promise<Store> {
    return this.updateStore(context, storeId, { status });
  }
}
