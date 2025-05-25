import { ArrowDown, ArrowUp } from 'lucide-react';

import React from 'react';
import { SortField } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StockHeaderCellProps {
  label: string;
  field: SortField;
  currentSort: {
    id: string;
    desc: boolean;
  } | undefined;
  onSort: () => void;
  className?: string;
}

const StockHeaderCell: React.FC<StockHeaderCellProps> = ({
  label,
  field,
  currentSort,
  onSort,
  className
}) => {
  const isActive = currentSort?.id === field;
  
  return (
    <div 
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none',
        isActive && 'text-primary',
        className
      )}
      onClick={onSort}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-primary">
            {!currentSort.desc ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default StockHeaderCell;
