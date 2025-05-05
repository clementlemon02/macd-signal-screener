
import React from 'react';
import { TimeFrame } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimeframeSelectorProps {
  timeFrames: TimeFrame[];
  selectedTimeFrames: TimeFrame[];
  onTimeFrameChange: (timeFrames: TimeFrame[]) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeFrames,
  selectedTimeFrames,
  onTimeFrameChange
}) => {
  const toggleTimeFrame = (timeFrame: TimeFrame) => {
    if (selectedTimeFrames.includes(timeFrame)) {
      onTimeFrameChange(selectedTimeFrames.filter(tf => tf !== timeFrame));
    } else {
      onTimeFrameChange([...selectedTimeFrames, timeFrame]);
    }
  };

  const selectAll = () => {
    onTimeFrameChange([...timeFrames]);
  };

  const clearAll = () => {
    onTimeFrameChange([]);
  };

  return (
    <div className="flex flex-col space-y-2 p-4 glass-card rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Timeframes</h3>
        <div className="flex space-x-2">
          <button 
            onClick={selectAll}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Select All
          </button>
          <span className="text-muted-foreground">|</span>
          <button 
            onClick={clearAll}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {timeFrames.map(timeFrame => (
          <button
            key={timeFrame}
            onClick={() => toggleTimeFrame(timeFrame)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full border transition-all duration-300',
              selectedTimeFrames.includes(timeFrame)
                ? 'bg-primary text-white border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50'
            )}
          >
            {timeFrame}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeframeSelector;
