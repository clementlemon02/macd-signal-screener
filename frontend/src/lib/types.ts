export type TimeFrame = 
  | 'D' 
  | '2D' 
  | '3D' 
  | '4D' 
  | 'W' 
  | '2W' 
  | '3W' 
  | 'M' 
  | '2M' 
  | '3M' 
  | '4M' 
  | '5M';

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

export interface MacdData {
  date: string;
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export interface PriceData {
  date: string;
  price: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  signals: StockSignals[];
  macdHistory: MacdData[];
  priceHistory: PriceData[];
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

export interface SignalDisplayConfig {
  type: SignalType;
  label: string;
  description: string;
  enabled: boolean;
}
