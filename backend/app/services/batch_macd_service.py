import numpy as np
import pandas as pd
import time
from typing import List, Dict, Any

class BatchMacdService:
    def __init__(self):
        self.fast_period = 12
        self.slow_period = 26
        self.signal_period = 9
        self.data = None  # Initialize self.data as None until data is passed

    def calculate_macd(self, prices: List[float], symbol: str, timeframe: str, dates: List[str]) -> Dict[str, List[float]]:
        """Calculate MACD, Signal line, and Histogram"""
        start_time = time.time()
        
        # Convert to numpy array for calculations
        prices_array = np.array(prices)
        
        # Calculate EMAs
        fast_ema = self._calculate_ema(prices_array, self.fast_period)
        slow_ema = self._calculate_ema(prices_array, self.slow_period)
        
        # Calculate MACD line
        macd_line = fast_ema - slow_ema
        
        # Calculate Signal line
        signal_line = self._calculate_ema(macd_line, self.signal_period)
        
        # Calculate Histogram
        histogram = macd_line - signal_line
        
        print("MACD:", macd_line)
        print("Signal:", signal_line)
        print("Histogram:", histogram)
        
        print(f"calculate_macd took {time.time() - start_time:.4f} seconds")
        
        # Store the data in a DataFrame
        self.data = pd.DataFrame({
            'symbol': [symbol] * len(prices),
            'timeframe': [timeframe] * len(prices),
            'date': pd.to_datetime(dates),
            'close_price': prices,
            'macd_line': macd_line,
            'signal_line': signal_line,
            'macd_histogram': histogram
        })
        
        return {
            "macd_line": macd_line.tolist(),
            "signal_line": signal_line.tolist(),
            "macd_histogram": histogram.tolist()
        }

    def _calculate_ema(self, data: np.ndarray, period: int) -> np.ndarray:
        """Calculate Exponential Moving Average"""
        start_time = time.time()
        result = pd.Series(data).ewm(span=period, adjust=False).mean().values
        print(f"_calculate_ema took {time.time() - start_time:.4f} seconds for period {period}")
        return result

    def detect_signals(self):
        """Detect trading signals based on MACD"""
        if self.data is None:
            raise ValueError("Data is not initialized. Please run calculate_macd() first.")
        
        self.data['signal_1'] = (self.data['macd_line'].shift(1) > self.data['signal_line'].shift(1)) & \
                                (self.data['macd_line'] < self.data['signal_line']) & \
                                (self.data['macd_line'] > 0)

        self.data['signal_2'] = (
            self.data['macd_line'] < 0.4 * self.data['macd_line'].combine(self.data['macd_line'].shift(1), max)
                    )

        self.data['signal_3'] = (self.data['macd_line'] - self.data['macd_line'].shift(1)) <= -0.1
        
        self.data['signal_4'] = (self.data['close_price'] < self.data['macd_line'])  # You may want to change this to ema_midpoint

        self.data['signal_5'] = (self.data['macd_histogram'] < self.data['macd_histogram'].shift(1)) & \
                                (self.data['macd_histogram'].shift(1) < self.data['macd_histogram'].shift(2))
        
        self.data['signal_6'] = (self.data['macd_line'] > self.data['macd_line'].shift(1)) & \
                                (self.data['macd_line'].shift(1) < self.data['macd_line'].shift(2))
        
        self.data['signal_7'] = (self.data['macd_line'].shift(1) < self.data['signal_line'].shift(1)) & \
                                (self.data['macd_line'] > self.data['signal_line'])
        
        # Now you can update 'meta_cycle_id' and 'meta_condition' as needed
        self.data['meta_cycle_id'] = pd.NA
        self.data['meta_condition'] = pd.NA

        # Assign cycle ids and conditions based on the signals
        cycle_id = 0
        current_cycle_step = 0

        for i in range(2, len(self.data)):
            if self.data['signal_1'].iloc[i]:
                current_cycle_step = 1
                cycle_id += 1
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Bearish MACD crossover above zero"
            
            if current_cycle_step == 1 and self.data['signal_2'].iloc[i]:
                current_cycle_step = 2
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "MACD dropped 60% from previous peak"
            
            if current_cycle_step == 2 and self.data['signal_3'].iloc[i]:
                current_cycle_step = 3
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "MACD steeply downward"
            
            if current_cycle_step == 3 and self.data['signal_4'].iloc[i]:
                current_cycle_step = 4
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Close below EMA midpoint"
            
            if current_cycle_step == 4 and self.data['signal_5'].iloc[i]:
                current_cycle_step = 5
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Histogram weakening 3 bars"
            
            if current_cycle_step == 5 and self.data['signal_6'].iloc[i]:
                current_cycle_step = 6
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "MACD upward reversal"
            
            if current_cycle_step == 6 and self.data['signal_7'].iloc[i]:
                current_cycle_step = 0
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Bullish MACD crossover"

    def calculate_signals(
        self,
        macd_data: Dict[str, List[float]],
        close_prices: List[float],
        ema_midpoints: List[float],
        symbol: str,
        timeframe: str,
        dates: List[str]
    ) -> List[Dict[str, Any]]:
        start_time = time.time()

        # Step 1: Compute MACD and signals
        self.calculate_macd(close_prices, symbol, timeframe, dates)
        self.detect_signals()

        # Step 2: Ensure 'date' is string-formatted to prevent JSON serialization issues
        self.data['date'] = pd.to_datetime(self.data['date']).dt.strftime('%Y-%m-%d')

        # Step 3: Select relevant columns and convert to list of dictionaries
        selected_columns = [
            'symbol', 'timeframe', 'date', 'close_price', 'macd_line', 'signal_line', 'macd_histogram',
            'signal_1', 'signal_2', 'signal_3', 'signal_4', 'signal_5', 'signal_6', 'signal_7',
            'meta_cycle_id', 'meta_condition'
        ]
        signal_list = self.data[selected_columns].to_dict('records')
        for signal in signal_list:
            signal['asset_type'] = 'crypto'


        print(f"calculate_signals took {time.time() - start_time:.4f} seconds")
        return signal_list


    def calculate_ema_midpoints(self, close_prices: List[float]) -> List[float]:
        """Calculate EMA midpoints for close prices"""
        start_time = time.time()
        
        ema_midpoints = self._calculate_ema(np.array(close_prices), self.fast_period).tolist()
        
        print(f"calculate_ema_midpoints took {time.time() - start_time:.4f} seconds")
        
        return ema_midpoints
