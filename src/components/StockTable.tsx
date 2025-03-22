
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockWithSignalCounts, TimeFrame, SortConfig, SortField, SortDirection } from '@/lib/types';
import { fetchStocks, getTimeFrames, getSortedStocks } from '@/lib/stockService';
import { formatPercent, formatPrice } from '@/lib/macdService';
import SignalIndicator from '@/components/SignalIndicator';
import StockHeaderCell from '@/components/StockHeaderCell';
import TimeframeSelector from '@/components/TimeframeSelector';
import MacdMiniChart from '@/components/MacdMiniChart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_SORT: SortConfig = { field: '1D', direction: 'desc' };

const StockTable: React.FC = () => {
  const [stocks, setStocks] = useState<StockWithSignalCounts[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockWithSignalCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [selectedTimeFrames, setSelectedTimeFrames] = useState<TimeFrame[]>(getTimeFrames());
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const timeFrames = useMemo(() => getTimeFrames(), []);

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
    // Filter and sort stocks when searchQuery, sortConfig, or selectedTimeFrames changes
    const filtered = stocks.filter(stock => {
      return (
        (searchQuery === '' || 
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
    
    setFilteredStocks(getSortedStocks(filtered, sortConfig));
  }, [stocks, searchQuery, sortConfig, selectedTimeFrames]);

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

  const handleTimeFrameChange = (timeFrames: TimeFrame[]) => {
    setSelectedTimeFrames(timeFrames);
  };

  const handleRowClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };

  return (
    <div className="w-full space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">MACD Signal Screener</h1>
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

      <TimeframeSelector
        timeFrames={timeFrames}
        selectedTimeFrames={selectedTimeFrames}
        onTimeFrameChange={handleTimeFrameChange}
      />

      <div className="glass-card rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Progress value={30} className="w-64 animate-pulse" />
            <p className="mt-4 text-sm text-muted-foreground">Loading stock data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <StockHeaderCell 
                    label="Symbol" 
                    field="symbol" 
                    currentSort={sortConfig} 
                    onSort={handleSort} 
                    className="w-24"
                  />
                  <StockHeaderCell 
                    label="Name" 
                    field="name" 
                    currentSort={sortConfig} 
                    onSort={handleSort}
                    className="w-48"
                  />
                  <StockHeaderCell 
                    label="Price" 
                    field="price" 
                    currentSort={sortConfig} 
                    onSort={handleSort}
                    className="w-24"
                  />
                  <StockHeaderCell 
                    label="Change" 
                    field="change" 
                    currentSort={sortConfig} 
                    onSort={handleSort}
                    className="w-24"
                  />
                  {selectedTimeFrames.map(timeFrame => (
                    <StockHeaderCell 
                      key={timeFrame}
                      label={timeFrame} 
                      field={timeFrame as SortField} 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      className="w-24 text-center"
                    />
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                    MACD (7d)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5 + selectedTimeFrames.length} className="px-4 py-8 text-center text-muted-foreground">
                      {searchQuery ? 'No matching stocks found' : 'No stocks available'}
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock, index) => (
                    <tr 
                      key={stock.symbol}
                      className="stock-row hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(stock.symbol)}
                    >
                      <td className="px-4 py-3 text-sm font-medium">{stock.symbol}</td>
                      <td className="px-4 py-3 text-sm">{stock.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatPrice(stock.price)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span 
                          className={`${stock.change >= 0 ? 'text-signal-positive' : 'text-signal-negative'}`}
                        >
                          {formatPercent(stock.change)}
                        </span>
                      </td>
                      {selectedTimeFrames.map(timeFrame => {
                        const timeframeSignals = stock.signals.find(
                          s => s.timeFrame === timeFrame
                        )?.signals || [];
                        
                        const signalCount = stock.signalCounts.find(
                          sc => sc.timeFrame === timeFrame
                        );
                        
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
                            {signalCount && (
                              <div className="text-xs text-center mt-1 font-medium">
                                <span className={`${signalCount.positiveCount > 3 ? 'text-signal-positive' : 'text-muted-foreground'}`}>
                                  {signalCount.positiveCount}/{signalCount.totalPossible}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        {stock.macdHistory && stock.macdHistory.length > 0 ? (
                          <MacdMiniChart data={stock.macdHistory} />
                        ) : (
                          <div className="text-xs text-muted-foreground text-center">No data</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTable;
