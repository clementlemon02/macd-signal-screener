
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StockWithSignalCounts, TimeFrame } from '@/lib/types';
import { getStockBySymbol, getTimeFrames } from '@/lib/stockService';
import { formatPercent, formatPrice } from '@/lib/macdService';
import SignalIndicator from '@/components/SignalIndicator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const TradingViewWidget: React.FC<{ symbol: string }> = ({ symbol }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_widget',
          studies: [
            {
              id: 'MAExp@tv-basicstudies',
              inputs: {
                length: 12,
              }
            },
            {
              id: 'MAExp@tv-basicstudies',
              inputs: {
                length: 26,
              }
            },
            {
              id: 'MACD@tv-basicstudies',
              inputs: {
                fastLength: 12,
                slowLength: 26,
                signalLength: 9,
              }
            }
          ]
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol]);

  return (
    <div id="tradingview_widget" className="w-full h-[500px] rounded-lg border border-border"></div>
  );
};

const StockDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [stock, setStock] = useState<StockWithSignalCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
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

  const selectedSignals = stock.signals.find(s => s.timeFrame === selectedTimeFrame)?.signals || [];

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
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="signals" className="pt-4">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">MACD Signals by Timeframe</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {timeFrames.map(tf => (
                    <Button
                      key={tf}
                      variant={selectedTimeFrame === tf ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTimeFrame(tf)}
                      className="rounded-full"
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="performance" className="pt-4">
              <h3 className="text-xl font-semibold mb-4">Signal Performance</h3>
              <div className="glass-card rounded-lg p-4">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-4 text-sm font-medium">Timeframe</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Active Signals</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Signal Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.signalCounts.map(sc => (
                      <tr key={sc.timeFrame} className="border-t border-border">
                        <td className="py-3 px-4">{sc.timeFrame}</td>
                        <td className="py-3 px-4">
                          {sc.positiveCount} / {sc.totalPossible}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                sc.positiveCount / sc.totalPossible > 0.5 
                                  ? 'bg-signal-positive' 
                                  : 'bg-signal-negative'
                              }`}
                              style={{ width: `${(sc.positiveCount / sc.totalPossible) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    TradingView: {
      widget: any;
    };
  }
}

export default StockDetail;
