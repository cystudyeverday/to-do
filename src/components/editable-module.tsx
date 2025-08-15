'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface EditableModuleProps {
  module: string;
  onSave: (newModule: string) => void;
  className?: string;
}

export function EditableModule({ module, onSave, className = '' }: EditableModuleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(module);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(module);
  }, [module]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== module) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(module);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="text-xs px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
          placeholder="Enter module name"
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
          title="Save"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded cursor-pointer hover:bg-purple-100 transition-colors flex items-center space-x-1 ${className}`}
      title="Click to edit module"
    >
      <span>{module}</span>
      <Edit2 className="w-3 h-3 opacity-50" />
    </span>
  );
} 