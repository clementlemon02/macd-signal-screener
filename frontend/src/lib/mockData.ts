import { Stock, Signal, SignalType, TimeFrame, MacdData, PriceData } from './types';

const timeFrames: TimeFrame[] = ['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '2Y', '3Y'];

const signalTypes: SignalType[] = [
  'MACD_CROSSOVER',
  'MACD_CROSSUNDER',
  'SIGNAL_ABOVE_ZERO',
  'SIGNAL_BELOW_ZERO',
  'HISTOGRAM_POSITIVE',
  'HISTOGRAM_NEGATIVE'
];

const generateRandomSignals = (timeFrame: TimeFrame, bias: number = 0.5): Signal[] => {
  return signalTypes.map(type => ({
    type,
    value: Math.random() < bias,
    timeFrame,
    date: new Date().toISOString()
  }));
};

const generateMockMacdHistory = (): MacdData[] => {
  const data: MacdData[] = [];
  let macdLine = Math.random() * 2 - 1;
  let signalLine = Math.random() * 2 - 1;
  
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    macdLine += (Math.random() - 0.5) * 0.4;
    signalLine += (Math.random() - 0.5) * 0.2;
    
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

const generateMockPriceHistory = (basePrice: number): PriceData[] => {
  const data: PriceData[] = [];
  let price = basePrice;
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some random price movement
    price += (Math.random() - 0.5) * (price * 0.02);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: +price.toFixed(2)
    });
  }
  
  return data;
};

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
    const bias = 0.3 + (index % 5) * 0.15;
    const price = +(100 + Math.random() * 900).toFixed(2);
    
    return {
      symbol: stock.symbol,
      name: stock.name,
      price: price,
      change: +(Math.random() * 10 - 5).toFixed(2),
      signals: timeFrames.map(timeFrame => ({
        timeFrame,
        signals: generateRandomSignals(timeFrame, bias)
      })),
      macdHistory: generateMockMacdHistory(),
      priceHistory: generateMockPriceHistory(price)
    };
  });
};

export const mockStocks = generateMockStocks();
