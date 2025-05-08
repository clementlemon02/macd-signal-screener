import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta

class MacdService:
    def __init__(self):
        self.fast_period = 12
        self.slow_period = 26
        self.signal_period = 9
        
    def calculate_macd(self, prices: List[float]) -> Dict[str, List[float]]:
        """Calculate MACD, Signal line, and Histogram"""
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
        
        return {
            "macd_line": macd_line.tolist(),
            "signal_line": signal_line.tolist(),
            "histogram": histogram.tolist()
        }
    
    def _calculate_ema(self, data: np.ndarray, period: int) -> np.ndarray:
        """Calculate Exponential Moving Average"""
        return pd.Series(data).ewm(span=period, adjust=False).mean().values

    def detect_signals(self, macd_data: Dict[str, List[float]], close_prices: List[float], ema_midpoints: List[float]) -> pd.DataFrame:
        """Detect MACD signals from the data"""
        # Create DataFrame from the input data
        self.data = pd.DataFrame({
            'macd_line': macd_data['macd_line'],
            'signal_line': macd_data['signal_line'],
            'histogram': macd_data['histogram'],
            'close': close_prices,
            'ema_midpoint': ema_midpoints
        })

        for n in range(1, 8):
            self.data[f'signal_{n}'] = False

        self.data['meta_cycle_id'] = pd.NA
        self.data['meta_condition'] = pd.NA

        current_cycle_step = 0
        cycle_id = 0

        for i in range(2, len(self.data)):
            # Get scalar values with .iloc
            macd = self.data['macd_line'].iloc[i]
            signal = self.data['signal_line'].iloc[i]
            hist = self.data['histogram'].iloc[i]

            prev_macd = self.data['macd_line'].iloc[i - 1]
            prev_signal = self.data['signal_line'].iloc[i - 1]
            prev_hist = self.data['histogram'].iloc[i - 1]

            prev2_hist = self.data['histogram'].iloc[i - 2]
            prev2_macd = self.data['macd_line'].iloc[i - 2]

            close = self.data['close'].iloc[i]
            ema_mid = self.data['ema_midpoint'].iloc[i] if 'ema_midpoint' in self.data.columns else None

            if ema_mid is not None and pd.notna(ema_mid):
                ema_mid = float(ema_mid)
            else:
                ema_mid = None

            # Signal 1: Bearish MACD crossover above zero
            if (prev_macd > prev_signal) and (macd < signal) and (macd > 0):
                # Reset if already in a cycle
                if current_cycle_step != 0:
                    current_cycle_step = 0  # Reset the cycle
                cycle_id += 1  # New cycle when signal_1 is detected
                self.data.loc[self.data.index[i], 'signal_1'] = True
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Bearish MACD crossover above zero"
                current_cycle_step = 1
                continue

            # Signal 2: MACD drops significantly from previous high
            if current_cycle_step == 1 and macd < 0.4 * max(prev_macd, macd):
                self.data.loc[self.data.index[i], 'signal_2'] = True
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "MACD dropped 60% from previous peak"
                current_cycle_step = 2
                continue

            # Signal 3: MACD angle down sharply (e.g., diff from prev)
            macd_slope = macd - prev_macd
            if current_cycle_step == 2 and macd_slope <= -0.1:
                self.data.loc[self.data.index[i], 'signal_3'] = True
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "MACD steeply downward"
                current_cycle_step = 3
                continue

            # Signal 4: Price crosses EMA midpoint
            if current_cycle_step == 3 and ema_mid is not None and close < ema_mid:
                self.data.loc[self.data.index[i], 'signal_4'] = True
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Close below EMA midpoint"
                current_cycle_step = 4
                continue

            # Signal 5: Histogram weakening (3 bars down in a row)
            if current_cycle_step == 4 and hist < prev_hist < prev2_hist:
                self.data.loc[self.data.index[i], 'signal_5'] = True
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Histogram weakening 3 bars"
                current_cycle_step = 5
                continue

            # Signal 6: MACD starts turning up (reversal)
            if current_cycle_step == 5 and macd > prev_macd and prev_macd < prev2_macd:
                self.data.loc[self.data.index[i], 'signal_6'] = True
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "MACD upward reversal"
                current_cycle_step = 6
                continue

            # Signal 7: Bullish MACD crossover
            if current_cycle_step == 6 and (prev_macd < prev_signal) and (macd > signal):
                self.data.loc[self.data.index[i], 'signal_7'] = True
                self.data.loc[self.data.index[i], 'meta_cycle_id'] = cycle_id
                self.data.loc[self.data.index[i], 'meta_condition'] = "Bullish MACD crossover"
                current_cycle_step = 0  # Reset after cycle completes
                continue

        return self.data
    
    def calculate_signals(self, macd_data: Dict[str, List[float]], close_prices: List[float], ema_midpoints: List[float]) -> List[Dict[str, Any]]:
        """Calculate MACD signals"""
        signals_df = self.detect_signals(macd_data, close_prices, ema_midpoints)
        
        # Convert signals to list of dictionaries for consistency with the original signals format
        signal_list = []
        for _, row in signals_df.iterrows():
            signal_list.append(row.to_dict())

        return signal_list
    
    def calculate_ema_midpoints(self, close_prices: List[float]) -> List[float]:
        """Calculate EMA midpoints for close prices"""
        # Calculate EMA for closing prices
        return self._calculate_ema(np.array(close_prices), self.fast_period).tolist()

