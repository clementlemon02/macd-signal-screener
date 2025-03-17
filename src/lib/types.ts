
export type TimeFrame = '1D' | '3D' | '1W' | '2W' | '1M' | '3M' | '6M' | '1Y';

export type SignalType = 
  | 'MACD_CROSSOVER' 
  | 'MACD_CROSSUNDER' 
  | 'SIGNAL_ABOVE_ZERO' 
  | 'SIGNAL_BELOW_ZERO' 
  | 'HISTOGRAM_POSITIVE' 
  | 'HISTOGRAM_NEGATIVE';

export interface Signal {
  type: SignalType;
  value: boolean;
  timeFrame: TimeFrame;
  date: string;
}

export interface StockSignals {
  timeFrame: TimeFrame;
  signals: Signal[];
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  signals: StockSignals[];
}

export interface TimeframeSignalCounts {
  timeFrame: TimeFrame;
  positiveCount: number;
  totalPossible: number;
}

export interface StockWithSignalCounts extends Stock {
  signalCounts: TimeframeSignalCounts[];
  totalPositiveSignals: number;
}

export type SortDirection = 'asc' | 'desc';

export type SortField = 'symbol' | 'name' | 'price' | 'change' | TimeFrame;

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
