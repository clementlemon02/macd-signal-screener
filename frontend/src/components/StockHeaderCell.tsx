import { ArrowDown, ArrowUp } from 'lucide-react';
import { SortDirection, SortField } from '@/lib/types';

import React from 'react';
import { cn } from '@/lib/utils';

interface StockHeaderCellProps {
  label: string;
  field: SortField;
  currentSort: {
    field: SortField;
    direction: SortDirection;
  };
  onSort: (field: SortField) => void;
  className?: string;
}

const StockHeaderCell: React.FC<StockHeaderCellProps> = ({
  label,
  field,
  currentSort,
  onSort,
  className
}) => {
  const isActive = currentSort.field === field;
  
  return (
    <th 
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none',
        isActive && 'text-primary',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-primary">
            {currentSort.direction === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export default StockHeaderCell;
