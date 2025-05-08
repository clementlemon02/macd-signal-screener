import { MacdData, PriceData, Stock, StockSignals, StockWithSignalCounts, TimeFrame } from './types';

import { calculateSignalCounts } from './macdService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MacdSignal {
  symbol: string;
  date: string;
  macd_line: number;
  signal_line: number;
  macd_histogram: number;
  close_price: number;
}

const calculatePriceChange = (priceHistory: PriceData[]): number => {
  if (priceHistory.length < 2) return 0;
  const latestPrice = priceHistory[priceHistory.length - 1].price;
  const previousPrice = priceHistory[priceHistory.length - 2].price;
  return ((latestPrice - previousPrice) / previousPrice) * 100;
};

export const fetchStocksFromSupabase = async (): Promise<StockWithSignalCounts[]> => {
  try {
    const { data: signals, error } = await supabase
      .from('macd_signals')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    const stocksBySymbol = new Map<string, Stock>();
    
    signals.forEach((signal: MacdSignal) => {
      if (!stocksBySymbol.has(signal.symbol)) {
        stocksBySymbol.set(signal.symbol, {
          symbol: signal.symbol,
          name: signal.symbol,
          price: signal.close_price,
          change: 0,
          signals: [],
          macdHistory: [],
          priceHistory: []
        });
      }
      
      const stock = stocksBySymbol.get(signal.symbol)!;
      stock.macdHistory.push({
        date: signal.date,
        macdLine: signal.macd_line,
        signalLine: signal.signal_line,
        histogram: signal.macd_histogram
      });
      stock.priceHistory.push({
        date: signal.date,
        price: signal.close_price
      });
    });

    // Calculate price changes after collecting all data
    stocksBySymbol.forEach(stock => {
      stock.change = calculatePriceChange(stock.priceHistory);
    });

    const stocks = Array.from(stocksBySymbol.values());
    return stocks.map(calculateSignalCounts);
  } catch (error) {
    console.error('Error fetching stocks from Supabase:', error);
    throw error;
  }
};

export const getStockBySymbolFromSupabase = async (symbol: string): Promise<StockWithSignalCounts | undefined> => {
  try {
    const { data: signals, error } = await supabase
      .from('macd_signals')
      .select('*')
      .eq('symbol', symbol)
      .order('date', { ascending: false });

    if (error) throw error;
    if (!signals.length) return undefined;

    const priceHistory = signals.map((signal: MacdSignal) => ({
      date: signal.date,
      price: signal.close_price
    }));

    const stock: Stock = {
      symbol: signals[0].symbol,
      name: signals[0].symbol,
      price: signals[0].close_price,
      change: calculatePriceChange(priceHistory),
      signals: [],
      macdHistory: signals.map((signal: MacdSignal) => ({
        date: signal.date,
        macdLine: signal.macd_line,
        signalLine: signal.signal_line,
        histogram: signal.macd_histogram
      })),
      priceHistory
    };

    return calculateSignalCounts(stock);
  } catch (error) {
    console.error('Error fetching stock from Supabase:', error);
    throw error;
  }
}; 