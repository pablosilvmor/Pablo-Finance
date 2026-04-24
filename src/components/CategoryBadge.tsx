import React from 'react';
import { Category } from '@/types';
import { iconMap } from '@/lib/icons';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category?: Category;
  className?: string;
  iconClassName?: string;
  circleClassName?: string;
  textClassName?: string;
  hideName?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  className = '', 
  iconClassName = 'w-3 h-3', 
  circleClassName = 'w-6 h-6',
  textClassName = 'text-zinc-700 dark:text-zinc-300',
  hideName = false 
}) => {
  if (!category) return null;

  const Icon = iconMap[category.icon] || FileText;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className={cn('rounded-full flex items-center justify-center shrink-0', circleClassName)} 
        style={{ backgroundColor: category.color || '#ccc' }}
      >
        <Icon className={cn('text-white', iconClassName)} />
      </div>
      {!hideName && <span className={textClassName}>{category.name}</span>}
    </div>
  );
};
