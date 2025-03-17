
import { Stock, StockWithSignalCounts, SortConfig, TimeFrame } from './types';
import { mockStocks } from './mockData';
import { calculateSignalCounts, sortStocks } from './macdService';

// In a real application, this would fetch data from an API
export const fetchStocks = async (): Promise<StockWithSignalCounts[]> => {
  // Simulate API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const stocksWithCounts = mockStocks.map(calculateSignalCounts);
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
  return ['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y'];
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
        resolve(calculateSignalCounts(stock));
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};
