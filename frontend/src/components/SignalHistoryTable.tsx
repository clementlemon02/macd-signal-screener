import { SignalFlags, SignalType, SingleStockWithMacdHistory, TimeFrame } from '@/lib/types';

import React from 'react';

const DEFAULT_SIGNAL_CONFIG = [
  {
    type: 'SIGNAL_1',
    label: 'Signal 1',
    description: 'Signal line crosses over MACD line while both are above zero',
    enabled: true,
  },
  {
    type: 'SIGNAL_2',
    label: 'Signal 2',
    description: 'MACD line drops 60% or more from its last peak point',
    enabled: true,
  },
  {
    type: 'SIGNAL_3',
    label: 'Signal 3',
    description: 'MACD line forms a 45-degree or steeper downtrend',
    enabled: true,
  },
  {
    type: 'SIGNAL_4',
    label: 'Signal 4',
    description: 'Close price reaches the midpoint between EMA52 and EMA24',
    enabled: true,
  },
  {
    type: 'SIGNAL_5',
    label: 'Signal 5',
    description: 'Histogram below zero turns white for 2 consecutive bars',
    enabled: true,
  },
  {
    type: 'SIGNAL_6',
    label: 'Signal 6',
    description: 'MACD line turns upward, making a higher point than the previous',
    enabled: true,
  },
];

interface SignalHistoryTableProps {
    signals: SingleStockWithMacdHistory;
    selectedTimeFrame: TimeFrame;
  }
  
  const SignalHistoryTable: React.FC<SignalHistoryTableProps> = ({
    signals,
    selectedTimeFrame,
  }) => {
    const signalHistory = signals.signals[selectedTimeFrame];
  
    // 1. Filter out entries with no *new* triggered signals
    const filteredSignalHistory = signalHistory
      ?.filter((entry) => entry.triggeredSignals.length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 2. Sort latest to oldest
  
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Signal History</h3>
        <div className="glass-card rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Signals Triggered</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignalHistory?.map((signalGroup, index) => {
                const triggeredLabels = signalGroup.triggeredSignals
                  .map((signalType) =>
                    DEFAULT_SIGNAL_CONFIG.find((config) => config.type === signalType)?.label || signalType
                  )
                  .join(', ');
  
                return (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 text-sm">
                      {new Date(signalGroup.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm">{triggeredLabels}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  export default SignalHistoryTable;