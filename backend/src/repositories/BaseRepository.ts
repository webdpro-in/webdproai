/**
 * Base DynamoDB Repository Implementation
 * Provides common CRUD operations for all repositories
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Repository, QueryableRepository } from '../interfaces/Repository';
import { PaginationParams, PaginatedResult } from '../types';

export abstract class BaseRepository<T extends Record<string, unknown>> implements QueryableRepository<T> {
  constructor(
    protected readonly dynamodb: DynamoDBDocumentClient,
    protected readonly tableName: string,
    protected readonly primaryKey: string
  ) {}

  async create(item: T): Promise<void> {
    try {
      await this.dynamodb.send(new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: `attribute_not_exists(${this.primaryKey})`,
      }));
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Item with ${this.primaryKey} already exists`);
      }
      throw new Error(`Failed to create item: ${error.message}`);
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const result = await this.dynamodb.send(new GetCommand({
        TableName: this.tableName,
        Key: { [this.primaryKey]: id },
      }));
      
      return (result.Item as T) || null;
    } catch (error: any) {
      throw new Error(`Failed to find item: ${error.message}`);
    }
  }

  async update(id: string, updates: Partial<T>): Promise<void> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== this.primaryKey) {
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      });

      if (updateExpressions.length === 0) {
        return;
      }

      await this.dynamodb.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { [this.primaryKey]: id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }));
    } catch (error: any) {
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.dynamodb.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { [this.primaryKey]: id },
      }));
    } catch (error: any) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  async findAll(params: PaginationParams = {}): Promise<PaginatedResult<T>> {
    try {
      const result = await this.dynamodb.send(new ScanCommand({
        TableName: this.tableName,
        Limit: params.limit || 50,
        ExclusiveStartKey: params.lastEvaluatedKey,
      }));

      return {
        items: (result.Items as T[]) || [],
        count: result.Count || 0,
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error: any) {
      throw new Error(`Failed to find all items: ${error.message}`);
    }
  }

  async findByField(
    field: string,
    value: unknown,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const result = await this.dynamodb.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: `#field = :value`,
        ExpressionAttributeNames: { '#field': field },
        ExpressionAttributeValues: { ':value': value },
        Limit: params.limit || 50,
        ExclusiveStartKey: params.lastEvaluatedKey,
      }));

      return {
        items: (result.Items as T[]) || [],
        count: result.Count || 0,
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error: any) {
      throw new Error(`Failed to find items by field: ${error.message}`);
    }
  }

  protected async queryByIndex(
    indexName: string,
    keyConditionExpression: string,
    expressionAttributeNames: Record<string, string>,
    expressionAttributeValues: Record<string, unknown>,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const result = await this.dynamodb.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: params.limit || 50,
        ExclusiveStartKey: params.lastEvaluatedKey,
      }));

      return {
        items: (result.Items as T[]) || [],
        count: result.Count || 0,
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error: any) {
      throw new Error(`Failed to query by index: ${error.message}`);
    }
  }
}
