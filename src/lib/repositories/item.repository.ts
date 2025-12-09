/**
 * Item Repository
 * Handles all item-related GraphQL operations
 */

import { apolloClient } from '../apollo-client';
import { GET_ITEMS, GET_ITEMS_BY_PROJECT, GET_ITEM_BY_ID } from '../graphql/queries';
import { CREATE_ITEM, UPDATE_ITEM, DELETE_ITEM, CREATE_ITEMS } from '../graphql/mutations';
import { TodoItem } from '@/types';
import {
  GetItemsResponse,
  GetItemsByProjectResponse,
  GetItemByIdResponse,
  CreateItemResponse,
  UpdateItemResponse,
  DeleteItemResponse,
  CreateItemsResponse,
} from '../graphql/types';
import {
  transformItem,
  transformItems,
  buildItemCreateInput,
  buildItemUpdateSet,
  buildItemBatchInsertInput,
} from '../graphql/transformers';
import { normalizeId } from '../graphql/utils';

/**
 * Item Repository Class
 * Provides CRUD operations for todo items
 */
export class ItemRepository {
  /**
   * Get all items
   */
  static async getAll(): Promise<TodoItem[]> {
    try {
      const { data } = await apolloClient.query<GetItemsResponse>({
        query: GET_ITEMS,
        fetchPolicy: 'network-only',
      });

      if (!data) return [];

      return transformItems(data.items);
    } catch (error) {
      console.error('[ItemRepository] Error fetching items:', error);
      return [];
    }
  }

  /**
   * Get items by project ID
   */
  static async getByProject(projectId: number | string): Promise<TodoItem[]> {
    try {
      const { data } = await apolloClient.query<GetItemsByProjectResponse>({
        query: GET_ITEMS_BY_PROJECT,
        variables: { projectId: normalizeId(projectId) },
        fetchPolicy: 'network-only',
      });

      if (!data) return [];

      return transformItems(data.items);
    } catch (error) {
      console.error('[ItemRepository] Error fetching project items:', error);
      return [];
    }
  }

  /**
   * Get item by ID
   */
  static async getById(id: number | string): Promise<TodoItem | null> {
    try {
      const { data } = await apolloClient.query<GetItemByIdResponse>({
        query: GET_ITEM_BY_ID,
        variables: { id: normalizeId(id) },
        fetchPolicy: 'network-only',
      });

      if (!data?.items_by_pk) return null;

      return transformItem(data.items_by_pk);
    } catch (error) {
      console.error('[ItemRepository] Error fetching item:', error);
      return null;
    }
  }

  /**
   * Create a new item
   */
  static async create(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    try {
      const { data } = await apolloClient.mutate<CreateItemResponse>({
        mutation: CREATE_ITEM,
        variables: buildItemCreateInput(item),
      });

      if (!data?.insert_items_one) {
        throw new Error('Failed to create item');
      }

      return transformItem(data.insert_items_one);
    } catch (error) {
      console.error('[ItemRepository] Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update an item
   */
  static async update(id: number | string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    try {
      const numId = normalizeId(id);
      const setObject = buildItemUpdateSet(updates);

      const { data } = await apolloClient.mutate<UpdateItemResponse>({
        mutation: UPDATE_ITEM,
        variables: {
          id: numId,
          set: setObject,
        },
      });

      if (!data?.update_items_by_pk) return null;

      return transformItem(data.update_items_by_pk);
    } catch (error) {
      console.error('[ItemRepository] Error updating item:', error);
      return null;
    }
  }

  /**
   * Delete an item
   */
  static async delete(id: number | string): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate<DeleteItemResponse>({
        mutation: DELETE_ITEM,
        variables: { id: normalizeId(id) },
      });

      return !!data?.delete_items_by_pk;
    } catch (error) {
      console.error('[ItemRepository] Error deleting item:', error);
      return false;
    }
  }

  /**
   * Create multiple items in batch
   */
  static async createBatch(items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TodoItem[]> {
    try {
      const objects = buildItemBatchInsertInput(items);

      const { data } = await apolloClient.mutate<CreateItemsResponse>({
        mutation: CREATE_ITEMS,
        variables: { objects },
      });

      if (!data?.insert_items) {
        throw new Error('Failed to create items');
      }

      return transformItems(data.insert_items.returning);
    } catch (error) {
      console.error('[ItemRepository] Error creating batch items:', error);
      throw error;
    }
  }

  /**
   * Get items by status
   */
  static async getByStatus(status: TodoItem['status']): Promise<TodoItem[]> {
    try {
      const allItems = await this.getAll();
      return allItems.filter((item) => item.status === status);
    } catch (error) {
      console.error('[ItemRepository] Error fetching items by status:', error);
      return [];
    }
  }

  /**
   * Get completed items within date range
   */
  static async getCompletedInRange(startDate: Date, endDate: Date): Promise<TodoItem[]> {
    try {
      const allItems = await this.getAll();
      return allItems.filter(
        (item) =>
          item.status === 'Completed' &&
          item.completedAt &&
          item.completedAt >= startDate &&
          item.completedAt <= endDate
      );
    } catch (error) {
      console.error('[ItemRepository] Error fetching completed items in range:', error);
      return [];
    }
  }
}

