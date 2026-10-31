import React from 'react';
import { getTagColorClass } from '../../services/documentData.ts';
import { X, Tag } from 'lucide-react';

interface DocumentTagBadgeProps {
  tag: string;
  onRemove?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const DocumentTagBadge: React.FC<DocumentTagBadgeProps> = ({
  tag,
  onRemove,
  onClick,
  isSelected = false,
  size = 'md',
  className = '',
}) => {
  const style = getTagColorClass(tag);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-all ${sizeClasses} ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300 dark:ring-blue-900'
          : `${style.bg} ${style.text} ${style.border}`
      } ${onClick ? 'cursor-pointer hover:opacity-85' : ''} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : style.dot}`} />
      <span>{tag}</span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title={`Remove tag ${tag}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
