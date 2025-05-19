import { MacdData, SortConfig, Stock, StockWithSignalCounts, TimeFrame } from './types';
import { calculateSignalCounts, sortStocks } from './macdService';
import { fetchStocksFromSupabase, getStockBySymbolFromSupabase } from './supabaseService';

// Generate random MACD data for the last 30 days
const generateMacdHistory = (): MacdData[] => {
  const data: MacdData[] = [];
  let macdLine = Math.random() * 2 - 1;
  let signalLine = Math.random() * 2 - 1;
  
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Create some random movement
    macdLine += (Math.random() - 0.5) * 0.4;
    signalLine += (Math.random() - 0.5) * 0.2;
    
    // Tend to converge/diverge occasionally
    if (Math.random() > 0.8) {
      signalLine = (signalLine + macdLine) / 2;
    }
    
    const histogram = macdLine - signalLine;
    
    data.push({
      date: date.toISOString().split('T')[0],
      macdLine,
      signalLine,
      histogram
    });
  }
  
  return data;
};

// Add MACD history to mock stocks
const addMacdHistoryToStocks = (stocks: Stock[]): Stock[] => {
  return stocks.map(stock => ({
    ...stock,
    macdHistory: generateMacdHistory()
  }));
};

// Get sorted and filtered stocks
export const getSortedStocks = (
  stocks: StockWithSignalCounts[],
  sortConfig: SortConfig
): StockWithSignalCounts[] => {
  return sortStocks(stocks, sortConfig);
};

// Get available timeframes
export const getTimeFrames = (): TimeFrame[] => {
  return ['1d', '3d','5d', '1wk', '2wk', '1mo', '3mo',];
};

// Fetch stocks from Supabase
export const fetchStocks = async (): Promise<StockWithSignalCounts[]> => {
  return fetchStocksFromSupabase();
};

// Get a single stock by symbol
export const getStockBySymbol = async (
  symbol: string
): Promise<StockWithSignalCounts | undefined> => {
  return getStockBySymbolFromSupabase(symbol);
};
