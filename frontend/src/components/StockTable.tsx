import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Signal, SignalDisplayConfig, SortConfig, SortDirection, SortField, StockWithSignalCounts, TimeFrame } from '@/lib/types';
import { fetchStocks, getSortedStocks, getTimeFrames } from '@/lib/stockService';
import { formatPercent, formatPrice } from '@/lib/macdService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MacdMiniChart from '@/components/MacdMiniChart';
import MiniPriceChart from './MiniPriceChart';
import { Progress } from '@/components/ui/progress';
import { SettingsDialog } from '@/components/SettingsDialog';
import SignalIndicator from '@/components/SignalIndicator';
import StockHeaderCell from '@/components/StockHeaderCell';
import { Switch } from '@/components/ui/switch';
import ThemeToggle from '@/components/ThemeToggle';
import WatchlistButton from '@/components/WatchlistButton';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useWatchlist } from '@/context/WatchlistContext';

// Add constants for local storage keys
const STORAGE_KEYS = {
  SELECTED_TIMEFRAMES: 'macd-screener-timeframes',
  MACD_DAYS: 'macd-screener-macd-days',
  PRICE_CHART_DAYS: 'macd-screener-price-chart-days',
  SIGNAL_CONFIG: 'macd-screener-signal-config'
};

const DEFAULT_SORT: SortConfig = { field: 'D', direction: 'desc' };
const DEFAULT_MACD_DAYS = 7;
const DEFAULT_PRICE_CHART_DAYS = 30;
const DEFAULT_TIMEFRAMES: TimeFrame[] = ['D', '2D', '3D', '4D', 'W', '2W', '3W', 'M', '2M', '3M', '4M', '5M'];
const DEFAULT_SIGNAL_CONFIG: SignalDisplayConfig[] = [
  {
    type: 'SIGNAL_1',
    label: 'Signal 1',
    description: 'Signal line crosses over MACD line while both are above zero',
    enabled: true,
  },
  {
    type: 'SIGNAL_2',
    label: 'Signal 2',
    description: 'MACD line drops 60% or more from its last peak point',
    enabled: true,
  },
  {
    type: 'SIGNAL_3',
    label: 'Signal 3',
    description: 'MACD line forms a 45-degree or steeper downtrend',
    enabled: true,
  },
  {
    type: 'SIGNAL_4',
    label: 'Signal 4',
    description: 'Close price reaches the midpoint between EMA52 and EMA24',
    enabled: true,
  },
  {
    type: 'SIGNAL_5',
    label: 'Signal 5',
    description: 'Histogram below zero turns white for 2 consecutive bars',
    enabled: true,
  },
  {
    type: 'SIGNAL_6',
    label: 'Signal 6',
    description: 'MACD line turns upward, making a higher point than the previous',
    enabled: true,
  },
  {
    type: 'SIGNAL_7',
    label: 'Signal 7',
    description: 'MACD line crosses above signal line while both are above zero and rising',
    enabled: true,
  },
];


const StockTable: React.FC = () => {
  const [stocks, setStocks] = useState<StockWithSignalCounts[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockWithSignalCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [selectedTimeframes, setSelectedTimeframes] = useState<TimeFrame[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_TIMEFRAMES);
    return stored ? JSON.parse(stored) : ['D', 'W', 'M', '3M', '2D', '3D', '4D', '2W'];
  });
  const [macdDays, setMacdDays] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.MACD_DAYS);
    return stored ? parseInt(stored, 10) : DEFAULT_MACD_DAYS;
  });
  const [priceChartDays, setPriceChartDays] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PRICE_CHART_DAYS);
    return stored ? parseInt(stored, 10) : DEFAULT_PRICE_CHART_DAYS;
  });
  const [signalConfig, setSignalConfig] = useState<SignalDisplayConfig[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SIGNAL_CONFIG);
    return stored ? JSON.parse(stored) : DEFAULT_SIGNAL_CONFIG;
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { watchlist } = useWatchlist();
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  
  const timeFrames = useMemo(() => getTimeFrames(), []);
  const displayTimeFrames: TimeFrame[] = ['D', 'W', 'M', '3M', '2D', '3D', '4D', '2W'];

  // Function to sort timeframes in ascending order
  const getSortedTimeframes = (timeframes: TimeFrame[]): TimeFrame[] => {
    const timeframeOrder: { [key: string]: number } = {
      'D': 1, '2D': 2, '3D': 3, '4D': 4,
      'W': 5, '2W': 6, '3W': 7,
      'M': 8, '2M': 9, '3M': 10, '4M': 11, '5M': 12
    };
    
    return [...timeframes].sort((a, b) => timeframeOrder[a] - timeframeOrder[b]);
  };

  // Get sorted timeframes for display
  const sortedSelectedTimeframes = useMemo(() => 
    getSortedTimeframes(selectedTimeframes), 
    [selectedTimeframes]
  );

  const loadStocks = async () => {
    setLoading(true);
    try {
      const data = await fetchStocks();
      setStocks(data);
      setFilteredStocks(getSortedStocks(data, sortConfig));
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast({
        title: 'Error loading stocks',
        description: 'There was a problem loading stock data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, []);

  useEffect(() => {
    let filtered = stocks;
    
    if (searchQuery) {
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (showWatchlistOnly) {
      filtered = filtered.filter(stock => watchlist.includes(stock.symbol));
    }
    
    setFilteredStocks(getSortedStocks(filtered, sortConfig));
  }, [stocks, searchQuery, sortConfig, watchlist, showWatchlistOnly]);

  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleRefresh = () => {
    loadStocks();
    toast({
      title: 'Refreshing data',
      description: 'Updating stock signals...',
      duration: 1500,
    });
  };

  const handleRowClick = (symbol: string) => {
    navigate(`/stock/${encodeURIComponent(symbol)}`);
  };

  const toggleWatchlistFilter = () => {
    setShowWatchlistOnly(!showWatchlistOnly);
  };

  // Save settings to local storage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_TIMEFRAMES, JSON.stringify(selectedTimeframes));
  }, [selectedTimeframes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MACD_DAYS, macdDays.toString());
  }, [macdDays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRICE_CHART_DAYS, priceChartDays.toString());
  }, [priceChartDays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIGNAL_CONFIG, JSON.stringify(signalConfig));
  }, [signalConfig]);

  // Update handleTimeframesChange to ensure signals are generated for all timeframes
  const handleTimeframesChange = (newTimeframes: TimeFrame[]) => {
    try {
      setSelectedTimeframes(newTimeframes);
    } catch (error) {
      console.error('Error saving timeframes:', error);
      toast({
        title: 'Error saving settings',
        description: 'Your timeframe settings could not be saved.',
        variant: 'destructive',
      });
    }
  };

  // Filter signals based on enabled configuration
  const getFilteredSignals = (signals: Signal[]) => {
    return signals.filter(signal => 
      signalConfig.find(config => config.type === signal.type)?.enabled
    );
  };

  // Update handleMacdDaysChange to ensure signals are generated for all timeframes
  const handleMacdDaysChange = (days: number) => {
    try {
      setMacdDays(days);
    } catch (error) {
      console.error('Error saving MACD days:', error);
      toast({
        title: 'Error saving settings',
        description: 'Your MACD days setting could not be saved.',
        variant: 'destructive',
      });
    }
  };

  // Update handlePriceChartDaysChange to ensure signals are generated for all timeframes
  const handlePriceChartDaysChange = (days: number) => {
    try {
      setPriceChartDays(days);
    } catch (error) {
      console.error('Error saving price chart days:', error);
      toast({
        title: 'Error saving settings',
        description: 'Your price chart days setting could not be saved.',
        variant: 'destructive',
      });
    }
  };

  // Update handleSignalConfigChange to ensure signals are generated for all timeframes
  const handleSignalConfigChange = (config: SignalDisplayConfig[]) => {
    try {
      setSignalConfig(config);
    } catch (error) {
      console.error('Error saving signal config:', error);
      toast({
        title: 'Error saving settings',
        description: 'Your signal configuration could not be saved.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full space-y-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">MACD Signal Screener</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <SettingsDialog
              selectedTimeframes={selectedTimeframes}
              macdDays={macdDays}
              priceChartDays={priceChartDays}
              enabledSignals={signalConfig}
              onTimeframesChange={handleTimeframesChange}
              onMacdDaysChange={handleMacdDaysChange}
              onPriceChartDaysChange={handlePriceChartDaysChange}
              onSignalConfigChange={handleSignalConfigChange}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="h-9 flex items-center gap-1"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="watchlist-filter"
            checked={showWatchlistOnly}
            onCheckedChange={toggleWatchlistFilter}
          />
          <Label htmlFor="watchlist-filter" className="cursor-pointer">Show watchlist only</Label>
        </div>
        
        {showWatchlistOnly && watchlist.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Your watchlist is empty. Add stocks by clicking the star icon.
          </div>
        )}
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Progress value={30} className="w-64 animate-pulse" />
            <p className="mt-4 text-sm text-muted-foreground">Loading stock data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-8">
                    {/* Empty header for watchlist column */}
                  </th>
                  <StockHeaderCell 
                    label="Symbol & Name" 
                    field="symbol" 
                    currentSort={sortConfig} 
                    onSort={handleSort} 
                    className="w-52"
                  />
                  <StockHeaderCell 
                    label="Price & Change" 
                    field="price" 
                    currentSort={sortConfig} 
                    onSort={handleSort}
                    className="w-52"
                  />
                  {sortedSelectedTimeframes.map(timeFrame => (
                    <StockHeaderCell 
                      key={timeFrame}
                      label={timeFrame} 
                      field={timeFrame as SortField} 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      className="w-28 text-center"
                    />
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                    Conv/Div
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">
                    MACD ({macdDays}d)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5 + sortedSelectedTimeframes.length} className="px-4 py-8 text-center text-muted-foreground">
                      {searchQuery || showWatchlistOnly 
                        ? 'No matching stocks found' 
                        : 'No stocks available'}
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    // Calculate convergence/divergence
                    const latestMacd = stock.macdHistory[stock.macdHistory.length - 1];
                    const prevMacd = stock.macdHistory[stock.macdHistory.length - 2];
                    const currentDistance = Math.abs(latestMacd.macdLine - latestMacd.signalLine);
                    const prevDistance = Math.abs(prevMacd.macdLine - prevMacd.signalLine);
                    const isConverging = currentDistance < prevDistance;
                    
                    
                    return (
                    <tr 
                      key={stock.symbol}
                      className="stock-row hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(stock.symbol)}
                    >
                      <td className="px-2 py-3 text-center">
                        <WatchlistButton symbol={stock.symbol} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{stock.symbol}</span>
                          <span className="text-sm text-muted-foreground">{stock.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatPrice(stock.price)}</span>
                          <span className={`text-sm ${stock.change >= 0 ? 'text-signal-positive' : 'text-signal-negative'}`}>
                            {formatPercent(stock.change)}
                          </span>
                          <div className="h-8 mt-1">
                            {stock.priceHistory && stock.priceHistory.length > 0 ? (
                              <MiniPriceChart 
                                data={stock.priceHistory} 
                                days={priceChartDays}
                              />
                            ) : (
                              <div className="text-xs text-muted-foreground text-center">No data</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {sortedSelectedTimeframes.map(timeFrame => {
                        let timeframeSignals = stock.signals.find(
                          s => s.timeFrame === timeFrame
                        )?.signals;

                        if (!timeframeSignals) {
                          timeframeSignals = signalConfig
                            .filter(config => config.enabled)
                            .map(config => ({
                              type: config.type,
                              value: false,
                              timeFrame,
                              date: new Date().toISOString()
                            }));
                        } else {
                          timeframeSignals = getFilteredSignals(timeframeSignals);
                        }
                        
                        const signalCount = {
                          timeFrame,
                          positiveCount: timeframeSignals.filter(s => s.value).length,
                          totalPossible: timeframeSignals.length
                        };
                        
                        return (
                          <td key={`${stock.symbol}-${timeFrame}`} className="px-4 py-3">
                            <div className="flex flex-wrap justify-center gap-1.5 py-1">
                              {timeframeSignals.map((signal, i) => (
                                <SignalIndicator
                                  key={`${stock.symbol}-${timeFrame}-${signal.type}`}
                                  value={signal.value}
                                  signalType={signal.type}
                                  size="sm"
                                />
                              ))}
                            </div>
                            <div className="text-xs text-center mt-1 font-medium">
                              <span className={`${signalCount.positiveCount > signalCount.totalPossible / 2 ? 'text-signal-positive' : 'text-muted-foreground'}`}>
                                {signalCount.positiveCount}/{signalCount.totalPossible}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {isConverging ? (
                            <ArrowUpCircle className="w-5 h-5 text-signal-positive animate-pulse" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-signal-negative animate-pulse" />
                          )}
                          <div className="flex flex-col items-center">
                            <div className={`text-sm font-medium ${isConverging ? 'text-signal-positive' : 'text-signal-negative'}`}>
                              {isConverging ? 'Converging' : 'Diverging'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {stock.macdHistory && stock.macdHistory.length > 0 ? (
                          <MacdMiniChart data={stock.macdHistory.slice(-macdDays)} />
                        ) : (
                          <div className="text-xs text-muted-foreground text-center">No data</div>
                        )}
                      </td>
                    </tr>
                  )}))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <SettingsDialog
        selectedTimeframes={selectedTimeframes}
        macdDays={macdDays}
        priceChartDays={priceChartDays}
        enabledSignals={signalConfig}
        onTimeframesChange={handleTimeframesChange}
        onMacdDaysChange={handleMacdDaysChange}
        onPriceChartDaysChange={handlePriceChartDaysChange}
        onSignalConfigChange={handleSignalConfigChange}
      />
    </div>
  );
};

export default StockTable;

