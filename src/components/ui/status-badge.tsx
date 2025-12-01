'use client';

import { ItemStatus, ItemType } from '@/types';
import { CheckCircle, Clock, AlertCircle, Wrench, Settings, Play, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ItemStatus;
  type: ItemType;
  className?: string;
}

const statusConfig: Record<ItemStatus, {
  icon: typeof Clock;
  color: string;
  text: string;
}> = {
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
  'Pending': {
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    text: '待处理'
  },
  'Completed': {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 border-green-300',
    text: '已完成'
  },
  'Archive': {
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    text: '已归档'
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
  
  // 安全检查：如果状态不存在，使用默认值
  if (!statusInfo) {
    console.warn(`Unknown status: ${status}`);
    return null;
  }
  
  if (!typeInfo) {
    console.warn(`Unknown type: ${type}`);
    return null;
  }
  
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