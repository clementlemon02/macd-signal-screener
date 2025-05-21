export type TimeFrame = 
  | '1d' 
  | '2d' 
  | '3d' 
  | '5d' 
  | '1wk' 
  | '2wk' 
  | '3wk' 
  | '1mo' 
  | '2mo' 
  | '3mo' 
  | '4mo' 
  | '5mo';

  export type SignalType = 
  | 'SIGNAL_1'
  | 'SIGNAL_2'
  | 'SIGNAL_3'
  | 'SIGNAL_4'
  | 'SIGNAL_5'
  | 'SIGNAL_6';


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

export interface MacdSignal {
  symbol: string;
  asset_type: string;
  timeframe: string;
  date: string;
  macd_line: number;
  signal_line: number;
  macd_histogram: number;
  signal_1: boolean;
  signal_2: boolean;
  signal_3: boolean;
  signal_4: boolean;
  signal_5: boolean;
  signal_6: boolean;
  signal_7: boolean;
  close_price: number;
}

export interface MacdHistoryItem {
  date: string;
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export interface SignalFlags {
  date: string;
  signal_1: boolean;
  signal_2: boolean;
  signal_3: boolean;
  signal_4: boolean;
  signal_5: boolean;
  signal_6: boolean;
  signal_7: boolean;
}

export interface StockWithMacdHistory {
  symbol: string;
  name: string;
  price: number;
  change: number;
  signals: { [timeframe: string]: SignalFlags[] };
  macdHistory: MacdHistoryItem[];
  priceHistory: { date: string; price: number }[];
  signalCounts?: Record<string, number>; // signalCounts is now Record<string, number>
  totalPositiveSignals?: Record<string, number>; 
}


export type SingleStockWithMacdHistory = {
  symbol: string;
  name: string;
  price: number;
  change;
  macdHistory: Record<string, {
    date: string;
    macdLine: number;
    signalLine: number;
    histogram: number;
  }[]>;
  priceHistory: { date: string; price: number }[];
  signals: Record<string, SignalFlags[]>;
};
export type SignalTriggered = {
  date: string;
  triggeredSignals: string[]; // e.g. ['signal_1', 'signal_4']
};

export type MacdHistoryEntry = {
  date: string;
  macdLine: number;
  signalLine: number;
  histogram: number;
};
