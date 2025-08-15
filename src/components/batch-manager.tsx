'use client';

import { useState } from 'react';
import { TodoItem, ItemStatus, ItemType } from '@/types';
import { StorageManager } from '@/lib/storage';
import {
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface BatchManagerProps {
  items: TodoItem[];
  onItemsUpdate: (updatedItems: TodoItem[]) => void;
}

export function BatchManager({ items, onItemsUpdate }: BatchManagerProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<ItemStatus>('Not start');
  const [batchType, setBatchType] = useState<ItemType>('Feature');
  const [batchModule, setBatchModule] = useState<string>('Other');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBatchUpdate = async () => {
    if (selectedItems.size === 0) {
      alert('Please select items to update');
      return;
    }

    const updatedItems: TodoItem[] = [];

    for (const itemId of selectedItems) {
      const updatedItem = StorageManager.updateItem(itemId, {
        status: batchStatus,
        type: batchType
      });

      if (updatedItem) {
        updatedItems.push(updatedItem);
      }
    }

    if (updatedItems.length > 0) {
      onItemsUpdate(updatedItems);
      setSelectedItems(new Set());
      setIsBatchEditing(false);
      alert(`Successfully updated ${updatedItems.length} items`);
    }
  };

  const handleBatchDelete = () => {
    if (selectedItems.size === 0) {
      alert('Please select items to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      const remainingItems: TodoItem[] = [];

      for (const item of items) {
        if (!selectedItems.has(item.id)) {
          remainingItems.push(item);
        } else {
          StorageManager.deleteItem(item.id);
        }
      }

      onItemsUpdate(remainingItems);
      setSelectedItems(new Set());
      alert(`Successfully deleted ${selectedItems.size} items`);
    }
  };

  const selectedCount = selectedItems.size;
  const allSelected = items.length > 0 && selectedCount === items.length;
  const someSelected = selectedCount > 0 && selectedCount < items.length;

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : someSelected ? (
                <div className="w-4 h-4 border-2 border-blue-600 bg-blue-600 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-sm" />
                </div>
              ) : (
                <Square className="w-4 h-4 border border-gray-300" />
              )}
              <span>Select All ({selectedCount}/{items.length})</span>
            </button>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBatchEditing(true)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <Edit3 className="w-3 h-3" />
                <span>Batch Edit</span>
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isBatchEditing && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={batchStatus}
                onChange={(e) => setBatchStatus(e.target.value as ItemStatus)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Not start">Not Started</option>
                <option value="On progress">In Progress</option>
                <option value="Waiting for API">Waiting for API</option>
                <option value="Build UI">Build UI</option>
                <option value="Integration">Integration</option>
                <option value="Completed">Completed</option>
                <option value="Fix">Fix</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={batchType}
                onChange={(e) => setBatchType(e.target.value as ItemType)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Feature">Feature</option>
                <option value="Issue">Issue</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchUpdate}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Save className="w-3 h-3" />
                <span>Update {selectedCount} items</span>
              </button>
              <button
                onClick={() => setIsBatchEditing(false)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {items.map(item => (
              <div key={item.id} className="flex items-center px-4 py-2 hover:bg-gray-50">
                <button
                  onClick={() => handleSelectItem(item.id)}
                  className="mr-3"
                >
                  {selectedItems.has(item.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 border border-gray-300" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
                <div className="ml-2 text-xs text-gray-500">
                  {item.status} • {item.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 