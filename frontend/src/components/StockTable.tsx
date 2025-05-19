import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Search } from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Signal, SignalDisplayConfig, SignalFlags, SortConfig, SortDirection, SortField, StockWithMacdHistory, TimeFrame } from '@/lib/types';
import { fetchStocksPageFromSupabase, getLatestCreatedAt } from '@/lib/supabaseService';
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
import { debounce } from 'lodash';
import mappingDirectory from '../lib/mapping_directory.json';
import { signOut } from '@/lib/supabaseAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useWatchlist } from '@/context/WatchlistContext';

const CURRENT_VERSION = '1.0.0'; 
// Add constants for local storage keys
const STORAGE_KEYS = {
  SELECTED_TIMEFRAMES: 'macd-screener-timeframes',
  MACD_DAYS: 'macd-screener-macd-days',
  PRICE_CHART_DAYS: 'macd-screener-price-chart-days',
  SIGNAL_CONFIG: 'macd-screener-signal-config-${VERSION}'
};


const DEFAULT_SORT: SortConfig = { field: '1d', direction: 'desc' };
const DEFAULT_MACD_DAYS = 7;
const DEFAULT_PRICE_CHART_DAYS = 30;
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
  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [uniqueSymbolCount, setUniqueSymbolCount] = useState(0);
  const [selectedAssetType, setSelectedAssetType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [stocks, setStocks] = useState<StockWithMacdHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframes, setSelectedTimeframes] = useState<TimeFrame[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_TIMEFRAMES);
    return stored ? JSON.parse(stored) : ['1d', '1wk', '1mo', '3mo', '2d', '3d', '5d', '2wk'];
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
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        console.warn("Invalid localStorage data. Resetting...");
      }
    }
  
    // Set fresh default config if none or invalid
    localStorage.setItem(STORAGE_KEYS.SIGNAL_CONFIG, JSON.stringify(DEFAULT_SIGNAL_CONFIG));
    return DEFAULT_SIGNAL_CONFIG;
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { watchlist } = useWatchlist();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);


  // Function to normalize timeframe for database
  const normalizeTimeFrame = (tf: string): string => {
    const map: Record<string, string> = {
      '1d': '1d',
      '2d': '2d',
      '3d': '3d',
      '5d': '5d',
      '1wk': '1wk',
      '2wk': '2wk',
      '3wk': '3wk',
      '1mo': '1mo',
      '2mo': '2mo',
      '3mo': '3mo',
      '4mo': '4mo',
      '5mo': '5mo'
    };
    return map[tf] || tf;
  };

  // Function to sort timeframes in ascending order
  const getSortedTimeframes = (timeframes: TimeFrame[]): TimeFrame[] => {
    const timeframeOrder: { [key: string]: number } = {
      '1d': 1, '2d': 2, '3d': 3, '5d': 4,
      '1wk': 5, '2wk': 6, '3wk': 7,
      '1mo': 8, '2mo': 9, '3mo': 10, '4mo': 11, '5mo': 12
    };
    
    return [...timeframes].sort((a, b) => timeframeOrder[a] - timeframeOrder[b]);
  };

  // Get sorted timeframes for display
  const sortedSelectedTimeframes = useMemo(() => 
    getSortedTimeframes(selectedTimeframes), 
    [selectedTimeframes]
  );

  // Fetch paginated stocks
  const loadStocks = useCallback(async (page = pageIndex, size = pageSize) => {
    setLoading(true);
    try {
      // If showing watchlist, fetch all stocks
      const { data, total, uniqueSymbolCount } = await fetchStocksPageFromSupabase(
        showWatchlistOnly ? 0 : page,
        showWatchlistOnly ? 1000 : size,
        selectedAssetType,
        searchQuery,
        sorting.length > 0 ? {
          field: sorting[0].id,
          direction: sorting[0].desc ? 'desc' : 'asc'
        } : undefined
      );

      if (showWatchlistOnly) {
        // Filter the fetched data to only include watchlist items
        const watchlistData = data.filter(stock => watchlist.includes(stock.symbol));
        setStocks(watchlistData);
        setTotalRows(watchlistData.length);
        setUniqueSymbolCount(watchlistData.length);
      } else {
        setStocks(data);
        // Use the total count from the backend
        setTotalRows(total || 0);
        setUniqueSymbolCount(uniqueSymbolCount);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      console.log(error)
      toast({
        title: 'Error loading stocks',
        description: 'There was a problem loading stock data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, selectedAssetType, searchQuery, sorting, showWatchlistOnly, watchlist, toast]);

  // Memoize filtered stocks to prevent unnecessary re-renders
  const filteredStocks = useMemo(() => {
    if (!showWatchlistOnly) return stocks;
    return stocks.filter(stock => watchlist.includes(stock.symbol));
  }, [stocks, showWatchlistOnly, watchlist]);

  // Update when watchlist filter changes
  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  // Update when other filters change
  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  // Add debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
      setPageIndex(0); // Reset to first page when searching
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (showWatchlistOnly) return 1;
    return Math.max(1, Math.ceil(uniqueSymbolCount  / pageSize));
  }, [uniqueSymbolCount , pageSize, showWatchlistOnly]);

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
    // Reset to first page when toggling watchlist
    setPageIndex(0);
  };

  // Save settings to local storage when they change
  useEffect(() => {
    const storedVersion = localStorage.getItem("VERSION");
  
    if (storedVersion !== CURRENT_VERSION) {
      localStorage.setItem("VERSION", CURRENT_VERSION);
      localStorage.setItem(STORAGE_KEYS.SELECTED_TIMEFRAMES, JSON.stringify(selectedTimeframes));
    }
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
  const getFilteredSignals = (timeframeSignals: SignalFlags[] | null, timeFrame: TimeFrame) => {
    if (!timeframeSignals || timeframeSignals.length === 0) {
      return signalConfig
        .filter(config => config.enabled)
        .map(config => ({
          type: config.type,
          value: false,
          timeFrame,
          date: new Date().toISOString()
        }));
    }
  
    const latestSignal = timeframeSignals[0]; // Most recent signal
    
  
    return signalConfig
    .filter(config => config.enabled)
    .map(config => {
      const key = `signal_${config.type.split('_')[1]}`;
      const value = latestSignal[key as keyof typeof latestSignal];
      
      return {
        type: config.type,
        value: value as boolean,
        timeFrame,
        date: latestSignal.date
      };
    });
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSort = (field: SortField) => {
    // For timeframe sorting, we need to sort by the count of signals
    const sortField = field === '1wk' || field === '2wk' || field === '3wk' || 
                     field === '1mo' || field === '2mo' || field === '3mo' || 
                     field === '4mo' || field === '5mo' || field === '1d' || 
                     field === '2d' || field === '3d' || field === '5d' ? field : field;
    
    setSorting(prev => {
      const currentSort = prev.find(sort => sort.id === sortField);
      if (currentSort) {
        // If already sorting by this field, toggle direction
        return prev.map(sort => 
          sort.id === sortField 
            ? { ...sort, desc: !sort.desc }
            : sort
        );
      } else {
        // If not sorting by this field, add new sort
        return [{ id: sortField, desc: false }];
      }
    });
  };

  // Function to calculate total positive signals for a timeframe
  const getTotalPositiveSignals = (timeframeSignals: SignalFlags[] | null, timeFrame: TimeFrame) => {
    if (!timeframeSignals || timeframeSignals.length === 0) return 0;
    const latestSignal = timeframeSignals[0];
    return Object.entries(latestSignal)
      .filter(([key]) => key.startsWith('signal_'))
      .reduce((sum, [_, value]) => sum + (value ? 1 : 0), 0);
  };

  // Add function to fetch last update time
  const fetchLastUpdate = async () => {
    try {
      const response = await getLatestCreatedAt();
      if (response) {
        const formattedDate = response.toISOString().split("T")[0]; // "YYYY-MM-DD"
        setLastUpdated(formattedDate);
      }
    } catch (error) {
      console.error("Error fetching last update time:", error);
    }
  };
  

  // Fetch last update time when component mounts
  useEffect(() => {
    fetchLastUpdate();
  }, []);

  // Define columns
  const columns = useMemo<ColumnDef<StockWithMacdHistory>[]>(() => [
    {
      id: 'watchlist',
      header: () => null,
      cell: ({ row }) => <WatchlistButton symbol={row.original.symbol} />,
      size: 40,
    },
    {
      id: 'symbol',
      header: () => <StockHeaderCell 
        label="Symbol & Name" 
        field="symbol" 
        currentSort={sorting.find(s => s.id === 'symbol')} 
        onSort={() => handleSort('symbol')} 
      />,
      cell: ({ row }) => {
        // Find the company name from the mapping directory
        let companyName = row.original.symbol;
        for (const category in mappingDirectory) {
          if (mappingDirectory[category][row.original.symbol]) {
            companyName = mappingDirectory[category][row.original.symbol];
            break;
          }
        }
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.symbol}</span>
            <span className="text-sm text-muted-foreground">{companyName}</span>
          </div>
        );
      },
      size: 200,
    },
    {
      id: 'price',
      header: () => <StockHeaderCell 
        label="Price & Change" 
        field="price" 
        currentSort={sorting.find(s => s.id === 'price')} 
        onSort={() => handleSort('price')} 
      />,
      cell: ({ row }) => {
        return(
        <div className="flex flex-col">
          <span className="font-medium">{formatPrice(row.original.price)}</span>
          <span className={`text-sm ${row.original.change >= 0 ? 'text-signal-positive' : 'text-signal-negative'}`}>
            {formatPercent(row.original.change)}
          </span>
          <div className="h-8 mt-1">
            {row.original.priceHistory && row.original.priceHistory.length > 0 ? (
              <MiniPriceChart 
                data={row.original.priceHistory} 
                days={priceChartDays}
              />
            ) : (
              <div className="text-xs text-muted-foreground text-center">No data</div>
            )}
          </div>
        </div>
      )},
      size: 200,
    },
    ...sortedSelectedTimeframes.map(timeFrame => ({
      
      id: timeFrame,
      header: () => <StockHeaderCell 
        label={timeFrame} 
        field={timeFrame} 
        currentSort={sorting.find(s => s.id === `signal_count_${timeFrame}`)} 
        onSort={() => handleSort(timeFrame)} 
      />,
      cell: ({ row }) => {
        const normalizedTimeFrame = normalizeTimeFrame(timeFrame);
        const timeframeSignals = row.original.signals?.[normalizedTimeFrame];
      
        if (!timeframeSignals) {
          console.warn("No timeframe signals found.");
          return null;
        }
      
        const filteredSignals = getFilteredSignals(timeframeSignals, timeFrame);
        const signalCount = {
          timeFrame,
          positiveCount: filteredSignals.filter(s => s.value).length,
          totalPossible: filteredSignals.length
        };
        
        return (
          <div>
            <div className="flex flex-wrap justify-center gap-1.5 py-1">
              {filteredSignals.map((signal) => (
                <SignalIndicator
                  key={`${row.original.symbol}-${timeFrame}-${signal.type}`}
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
          </div>
        );
      },
      sortingFn: (rowA, rowB, columnId) => {
        const timeFrame = columnId as TimeFrame;
        const normalizedTimeFrame = normalizeTimeFrame(timeFrame);
        
        const signalsA = rowA.original.signals?.[normalizedTimeFrame] || [];
        const signalsB = rowB.original.signals?.[normalizedTimeFrame] || [];
        
        const countA = getTotalPositiveSignals(signalsA, timeFrame);
        const countB = getTotalPositiveSignals(signalsB, timeFrame);
        
        return countA - countB;
      },
      size: 140,
    })),
    {
      id: 'convergence',
      header: 'Conv/Div',
      cell: ({ row }) => {
        let isConverging = false;
        if (row.original.macdHistory && row.original.macdHistory.length >= 2) {
          const latestMacd = row.original.macdHistory[row.original.macdHistory.length - 1];
          const prevMacd = row.original.macdHistory[row.original.macdHistory.length - 2];
          const currentDistance = Math.abs(latestMacd.macdLine - latestMacd.signalLine);
          const prevDistance = Math.abs(prevMacd.macdLine - prevMacd.signalLine);
          isConverging = currentDistance < prevDistance;
        }
        
        return (
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
        );
      },
      size: 100,
    },
    {
      id: 'macd',
      header: `MACD (${macdDays}d)`,
      cell: ({ row }) => {
        return (
        row.original.macdHistory && row.original.macdHistory.length > 0 ? (
          <MacdMiniChart 
            data={row.original.macdHistory.slice(-macdDays)} 
          />
        ) : (
          <div className="text-xs text-muted-foreground text-center">No data</div>
        )
      )},
      size: 160,
    },
  ], [sortedSelectedTimeframes, sorting, priceChartDays, macdDays]);

  // Initialize table
  const table = useReactTable({
    data: filteredStocks,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      pagination: {
        pageIndex: showWatchlistOnly ? 0 : pageIndex,
        pageSize: showWatchlistOnly ? filteredStocks.length : pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize });
        if (!showWatchlistOnly) {
          setPageIndex(newState.pageIndex);
          setPageSize(newState.pageSize);
        }
      }
    },
    manualPagination: true,
    manualSorting: sorting.length > 0 && !sorting[0].id.startsWith('signal_count_'),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full space-y-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">MACD Signal Screener</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lastUpdated && (
              <span>Last updated: {(lastUpdated)}</span>
            )}
          </div>
          <ThemeToggle />
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search stocks..."
                onChange={handleSearchChange}
                className="pl-9 h-9"
              />
            </div>
            <select
              value={selectedAssetType}
              onChange={(e) => {
                setSelectedAssetType(e.target.value);
                setPageIndex(0); // Reset to first page when changing asset type
              }}
              className="h-9 px-3 py-1 bg-background border border-input rounded-md"
            >
              <option value="">All Assets</option>
              <option value="S&P500">S&P 500</option>
              <option value="Top 50 Crypto">Top 50 Crypto</option>
              <option value="Bursa Top 30 Blue Chips">Bursa Top 30 Blue Chips</option>
              <option value="GOLD">Gold</option>
            </select>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-9 flex items-center gap-1"
          >
            Logout
          </Button>
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-border">
                <thead className="bg-muted/30">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                        {searchQuery || showWatchlistOnly 
                          ? 'No matching stocks found' 
                          : 'No stocks available'}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr
                        key={row.id}
                        className="stock-row hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(row.original.symbol)}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className="px-4 py-3"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center py-4">
              <div>
                Page {pageIndex + 1} of {totalPages}
              </div>
              <div className="flex gap-2 items-center">
                <Button 
                  onClick={() => setPageIndex(0)} 
                  disabled={pageIndex === 0}
                >
                  First
                </Button>
                <Button 
                  onClick={() => setPageIndex(pageIndex - 1)} 
                  disabled={pageIndex === 0}
                >
                  Previous
                </Button>
                <Button 
                  onClick={() => setPageIndex(pageIndex + 1)} 
                  disabled={pageIndex >= totalPages - 1}
                >
                  Next
                </Button>
                <Button 
                  onClick={() => setPageIndex(totalPages - 1)} 
                  disabled={pageIndex >= totalPages - 1}
                >
                  Last
                </Button>
                <span className="ml-4">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPageIndex(0); // Reset to first page when changing page size
                  }}
                  className="border rounded px-2 py-1"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
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

