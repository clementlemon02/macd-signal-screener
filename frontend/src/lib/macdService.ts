import { SortConfig, SortField, Stock, StockWithSignalCounts, TimeFrame, TimeframeSignalCounts } from './types';

// Calculate signal counts for each timeframe
export const calculateSignalCounts = (stock: Stock): StockWithSignalCounts => {
  const signalCounts: TimeframeSignalCounts[] = stock.signals.map(timeframeSignals => {
    const positiveCount = timeframeSignals.signals.filter(signal => signal.value).length;
    return {
      timeFrame: timeframeSignals.timeFrame,
      positiveCount,
      totalPossible: timeframeSignals.signals.length
    };
  });

  const totalPositiveSignals = signalCounts.reduce(
    (total, current) => total + current.positiveCount, 
    0
  );

  return {
    ...stock,
    signalCounts,
    totalPositiveSignals
  };
};

// Sort stocks based on the selected sort field and direction
export const sortStocks = (
  stocks: StockWithSignalCounts[], 
  sortConfig: SortConfig
): StockWithSignalCounts[] => {
  return [...stocks].sort((a, b) => {
    let comparison = 0;
    
    if (sortConfig.field === 'symbol') {
      comparison = a.symbol.localeCompare(b.symbol);
    } 
    else if (sortConfig.field === 'name') {
      comparison = a.name.localeCompare(b.name);
    }
    else if (sortConfig.field === 'price') {
      comparison = a.price - b.price;
    }
    else if (sortConfig.field === 'change') {
      comparison = a.change - b.change;
    }
    else {
      // For timeframe-based sorting
      const timeFrame = sortConfig.field as TimeFrame;
      const aSignalCount = a.signalCounts.find(sc => sc.timeFrame === timeFrame)?.positiveCount || 0;
      const bSignalCount = b.signalCounts.find(sc => sc.timeFrame === timeFrame)?.positiveCount || 0;
      
      // Primary sort by signal count for the timeframe
      comparison = bSignalCount - aSignalCount;
      
      // Secondary sort by total positive signals if signal counts are equal
      if (comparison === 0) {
        comparison = b.totalPositiveSignals - a.totalPositiveSignals;
      }
    }
    
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
};

// Get chart URL for TradingView
export const getTradingViewChartUrl = (symbol: string): string => {
  return `https://www.tradingview.com/chart/?symbol=${symbol}`;
};

// Get explanation for each MACD signal type
export const getMacdSignalExplanation = (signalType: string): string => {
  const explanations: Record<string, string> = {
    SIGNAL_1: "Signal line crosses over MACD above zero line",
    SIGNAL_2: "MACD line drops 60% from last peak point",
    SIGNAL_3: "MACD line reaches a 45-degree slope downtrend",
    SIGNAL_4: "Close price reaches midpoint of EMA52 and EMA24",
    SIGNAL_5: "Histogram below zero turns white for 2 bars",
    SIGNAL_6: "MACD line turns uptrend (higher than last point)",
    SIGNAL_7: "MACD crosses signal line; both above zero and rising"
  };
  
  return explanations[signalType] || "Unknown signal type";
};

// Format a number as a percentage
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${(value).toFixed(2)}%`;
};

// Format a price value
export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
