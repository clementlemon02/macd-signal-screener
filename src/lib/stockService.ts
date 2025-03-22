import { Stock, StockWithSignalCounts, SortConfig, TimeFrame, MacdData } from './types';
import { mockStocks } from './mockData';
import { calculateSignalCounts, sortStocks } from './macdService';

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

// In a real application, this would fetch data from an API
export const fetchStocks = async (): Promise<StockWithSignalCounts[]> => {
  // Simulate API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const stocksWithMacd = addMacdHistoryToStocks(mockStocks);
      const stocksWithCounts = stocksWithMacd.map(calculateSignalCounts);
      resolve(stocksWithCounts);
    }, 500);
  });
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
  return ['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '2Y', '3Y'];
};

// Get a single stock by symbol
export const getStockBySymbol = async (
  symbol: string
): Promise<StockWithSignalCounts | undefined> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const stock = mockStocks.find(stock => stock.symbol === symbol);
      if (stock) {
        const stockWithMacd = {
          ...stock,
          macdHistory: generateMacdHistory()
        };
        resolve(calculateSignalCounts(stockWithMacd));
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};
