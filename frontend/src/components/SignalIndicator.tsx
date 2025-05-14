import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import React from 'react';
import { SignalType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getMacdSignalExplanation } from '@/lib/macdService';

interface SignalIndicatorProps {
  value: boolean;
  signalType: SignalType;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const SignalIndicator: React.FC<SignalIndicatorProps> = ({
  value,
  signalType,
  size = 'md',
  animated = false
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  // Extract just the number from the signal type (e.g., "SIGNAL_1" -> "1")
  const signalNumber = signalType.split('_')[1];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-full transition-all duration-300',
              sizeClasses[size],
              value ? 'bg-signal-positive' : 'bg-signal-negative',
              animated && value && 'animate-pulse-signal'
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">
            <span className="font-semibold">Signal {signalNumber}: </span>
            {getMacdSignalExplanation(signalType)}
          </p>
          <p className="text-xs mt-1 font-semibold">
            Status: {value ? 'Active' : 'Inactive'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SignalIndicator;
