'use client';

import { ItemStatus, ItemType } from '@/types';
import { CheckCircle, Clock, AlertCircle, Wrench, Settings, Play, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ItemStatus;
  type: ItemType;
  className?: string;
}

const statusConfig = {
  'Not start': {
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    text: '未开始'
  },
  'On progress': {
    icon: Play,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    text: '进行中'
  },
  'Waiting for API': {
    icon: Settings,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    text: '等待API'
  },
  'Build UI': {
    icon: Wrench,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    text: '构建UI'
  },
  'Integration': {
    icon: Settings,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    text: '集成'
  },
  'Completed': {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 border-green-300',
    text: '已完成'
  },
  'Fix': {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 border-red-300',
    text: '修复'
  }
};

const typeConfig = {
  'Feature': {
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    text: '功能'
  },
  'Issue': {
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    text: '问题'
  }
};

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const statusInfo = statusConfig[status];
  const typeInfo = typeConfig[type];
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn('flex gap-1', className)}>
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border',
        statusInfo.color
      )}>
        <StatusIcon className="w-3 h-3" />
        {statusInfo.text}
      </span>
      <span className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border',
        typeInfo.color
      )}>
        {typeInfo.text}
      </span>
    </div>
  );
} 