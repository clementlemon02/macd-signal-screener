import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { SignalDisplayConfig, SignalFlags, SignalType, SingleStockWithMacdHistory, StockWithMacdHistory, TimeFrame } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPercent, formatPrice } from '@/lib/macdService';
import { getStockBySymbol, getTimeFrames } from '@/lib/stockService';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import SignalHistoryTable from '@/components/SignalHistoryTable';
import SignalIndicator from '@/components/SignalIndicator';
import mappingDirectoryTradV from '@/lib/mapping_directoryTradV.json';
import { useToast } from '@/components/ui/use-toast';

const TIMEFRAMES: TimeFrame[] = ['1d', '2d', '3d', '5d', '1wk', '2wk', '3wk', '1mo', '2mo', '3mo', '4mo', '5mo'];

// Add TradingView widget type
declare global {
  interface Window {
    TradingView: {
      widget: new (config: TradingViewWidgetConfig) => unknown;
    };
  }
}

interface TradingViewWidgetConfig {
  width: string;
  height: number;
  symbol: string;
  interval: string;
  timezone: string;
  theme: string;
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  allow_symbol_change: boolean;
  container_id: string;
}

const TradingViewWidget: React.FC<{ symbol: string }> = ({ symbol }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        // Get the mapped symbol from mapping_directoryTradV.json
        let formattedSymbol = symbol;
        
        // Check in each category
        for (const category in mappingDirectoryTradV) {
          if (mappingDirectoryTradV[category][symbol]) {
            formattedSymbol = mappingDirectoryTradV[category][symbol];
            break;
          }
        }

        new window.TradingView.widget({
          width: '100%',
          height: 500,
          symbol: formattedSymbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_widget'
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [symbol]);

  return <div id="tradingview_widget" />;
};

const StockDetail: React.FC = () => {
  const { symbol: encodedSymbol } = useParams<{ symbol: string }>();
  const symbol = encodedSymbol ? decodeURIComponent(encodedSymbol) : '';
  const [stock, setStock] = useState<SingleStockWithMacdHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1d');
  const { toast } = useToast();
  const navigate = useNavigate();
  const timeFrames = getTimeFrames();


  useEffect(() => {
    const loadStock = async () => {
      if (!symbol) return;
      
      setLoading(true);
      try {
        const stockData = await getStockBySymbol(symbol);
        if (stockData) {
          setStock(stockData);
          if (stockData.signals && Object.keys(stockData.signals).length > 0) {
            setSelectedTimeFrame(Object.keys(stockData.signals)[0] as TimeFrame);
          }
        } else {
          toast({
            title: 'Stock not found',
            description: `Could not find stock with symbol: ${symbol}`,
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading stock:', error);
        toast({
          title: 'Error loading stock',
          description: 'There was a problem loading stock data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [symbol, navigate, toast]);

  const handleBackClick = () => {
    navigate('/');
  };

  const openTradingView = () => {
    window.open(`https://www.tradingview.com/chart/?symbol=${symbol}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 animate-pulse">
        <div className="glass-card rounded-lg p-6">
          <div className="h-8 w-48 bg-muted/50 rounded mb-4"></div>
          <div className="h-6 w-96 bg-muted/30 rounded mb-8"></div>
          <div className="h-[400px] bg-muted/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="container mx-auto py-12">
        <div className="glass-card rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Stock not found</h2>
          <p className="text-muted-foreground mb-6">Could not find stock with symbol: {symbol}</p>
          <Button onClick={handleBackClick}>Back to Screener</Button>
        </div>
      </div>
    );
  }

  const selectedSignals = stock?.signals[selectedTimeFrame]?.[0] ? Object.entries(stock.signals[selectedTimeFrame][0])
    .filter(([key]) => key.startsWith('signal_'))
    .map(([key, value]) => ({
      type: key.toUpperCase() as SignalType,
      value: value as boolean,
      date: stock.signals[selectedTimeFrame][0].date
    })) : [];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:max-w-6xl animate-fade-in">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={handleBackClick}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Screener
      </Button>

      <div className="glass-card rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                {stock.symbol} 
                <span className="text-lg ml-2 text-muted-foreground">
                  {stock.name}
                </span>
              </h1>
              <div className="flex items-center mt-2">
                <span className="text-xl font-semibold mr-3">{formatPrice(stock.price)}</span>
                <span 
                  className={`text-sm font-medium ${
                    stock.change >= 0 ? 'text-signal-positive' : 'text-signal-negative'
                  }`}
                >
                  {formatPercent(stock.change)}
                </span>
              </div>
            </div>
            <Button 
              className="flex items-center" 
              onClick={openTradingView}
            >
              <span>Open in TradingView</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mb-8">
            <TradingViewWidget symbol={stock.symbol} />
          </div>

          <Tabs defaultValue="signals" className="w-full">
            <TabsList>
              <TabsTrigger value="signals">MACD Signals</TabsTrigger>
            </TabsList>
            <TabsContent value="signals" className="pt-4">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">MACD Signals by Timeframe</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {TIMEFRAMES
                    .filter(timeFrame => stock.signals[timeFrame])
                    .map(timeFrame => (
                      <Button
                        key={timeFrame}
                        variant={selectedTimeFrame === timeFrame ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTimeFrame(timeFrame)}
                        className="rounded-full"
                      >
                        {timeFrame}
                      </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {selectedSignals.map(signal => {
                    const signalName = signal.type.replace(/_/g, ' ');
                    return (
                      <Card key={signal.type} className={`transition-all duration-300 ${signal.value ? 'border-signal-positive/30' : 'border-signal-negative/30'}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <SignalIndicator 
                              value={signal.value} 
                              signalType={signal.type}
                              size="lg"
                              animated={signal.value}
                            />
                            <span className="ml-2">{signalName}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {signal.value ? 'Signal is active' : 'Signal is not active'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {new Date(signal.date).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <SignalHistoryTable 
                  signals={stock}
                  selectedTimeFrame={selectedTimeFrame}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
