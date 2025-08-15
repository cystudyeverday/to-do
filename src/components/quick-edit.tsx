'use client';

import { useState } from 'react';
import { TodoItem, ItemStatus, ItemType } from '@/types';
import { StorageManager } from '@/lib/storage';
import { StatusBadge } from '@/components/ui/status-badge';
import { Edit3, Save, X, ChevronDown } from 'lucide-react';

interface QuickEditProps {
  item: TodoItem;
  onUpdate: (updatedItem: TodoItem) => void;
}

export function QuickEdit({ item, onUpdate }: QuickEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [type, setType] = useState<ItemType>(item.type);
  const [module, setModule] = useState<string>((item as any).module || 'Other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const updatedItem = StorageManager.updateItem(item.id, {
        status,
        type,
        module
      });

      if (updatedItem) {
        onUpdate(updatedItem);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setStatus(item.status);
    setType(item.type);
    setModule((item as any).module || 'Other');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ItemStatus)}
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

        <select
          value={type}
          onChange={(e) => setType(e.target.value as ItemType)}
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Feature">Feature</option>
          <option value="Issue">Issue</option>
        </select>

        <input
          type="text"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          placeholder="Module"
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
        />

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
          title="Save changes"
        >
          <Save className="w-3 h-3" />
        </button>

        <button
          onClick={handleCancel}
          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <StatusBadge status={item.status} type={item.type} />
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Quick edit"
      >
        <Edit3 className="w-3 h-3" />
      </button>
    </div>
  );
} 