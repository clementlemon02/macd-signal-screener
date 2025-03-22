
import { Stock, Signal, SignalType, TimeFrame, MacdData } from './types';

const timeFrames: TimeFrame[] = ['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y'];

const signalTypes: SignalType[] = [
  'MACD_CROSSOVER',
  'MACD_CROSSUNDER',
  'SIGNAL_ABOVE_ZERO',
  'SIGNAL_BELOW_ZERO',
  'HISTOGRAM_POSITIVE',
  'HISTOGRAM_NEGATIVE'
];

// Helper function to generate random boolean values for signals with
// a slightly higher probability of positive signals for some stocks
const generateRandomSignals = (timeFrame: TimeFrame, bias: number = 0.5): Signal[] => {
  return signalTypes.map(type => ({
    type,
    value: Math.random() < bias,
    timeFrame,
    date: new Date().toISOString()
  }));
};

// Generate mock MACD history data
const generateMockMacdHistory = (): MacdData[] => {
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

// Generate stock mock data with random signals
export const generateMockStocks = (count: number = 20): Stock[] => {
  const stockSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'MA', name: 'Mastercard Inc.' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'BAC', name: 'Bank of America Corp.' },
    { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'ADBE', name: 'Adobe Inc.' },
    { symbol: 'INTC', name: 'Intel Corporation' },
    { symbol: 'CRM', name: 'Salesforce Inc.' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
    { symbol: 'VZ', name: 'Verizon Communications Inc.' },
    { symbol: 'PFE', name: 'Pfizer Inc.' }
  ];

  return stockSymbols.slice(0, count).map((stock, index) => {
    // Create a bias that varies by stock to make some stocks appear "better" than others
    const bias = 0.3 + (index % 5) * 0.15;
    
    return {
      symbol: stock.symbol,
      name: stock.name,
      price: +(100 + Math.random() * 900).toFixed(2),
      change: +(Math.random() * 10 - 5).toFixed(2),
      signals: timeFrames.map(timeFrame => ({
        timeFrame,
        signals: generateRandomSignals(timeFrame, bias)
      })),
      macdHistory: generateMockMacdHistory()
    };
  });
};

export const mockStocks = generateMockStocks();
