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
        
        return {
            "macd_line": macd_line.tolist(),
            "signal_line": signal_line.tolist(),
            "histogram": histogram.tolist()
        }
    
    def _calculate_ema(self, data: np.ndarray, period: int) -> np.ndarray:
        """Calculate Exponential Moving Average"""
        return pd.Series(data).ewm(span=period, adjust=False).mean().values

    def detect_signals(self, macd_data: Dict[str, List[float]], close_prices: List[float], ema_midpoints: List[float]) -> pd.DataFrame:
        """Detect various MACD signals and add them to a DataFrame"""
        # Prepare signals dataframe
        signal_columns = ['signal_1', 'signal_2', 'signal_3', 'signal_4', 'signal_5', 'signal_6', 'signal_7', 'signal_8']
        signals_df = pd.DataFrame(index=range(2, len(macd_data["macd_line"])))

        for col in signal_columns:
            signals_df[col] = pd.NA  # Initialize with missing values

        for i in range(2, len(macd_data["macd_line"])):
            # Signal 1: Bearish Crossover
            signals_df.loc[i, 'signal_1'] = (
                (macd_data["signal_line"][i] > macd_data["macd_line"][i]) &
                (macd_data["signal_line"][i-1] <= macd_data["macd_line"][i-1]) &
                (macd_data["macd_line"][i] > 0) &
                (macd_data["signal_line"][i] > 0)
            )

            # Signal 2: Sharp Drop (60% from peak)
            peak_value = macd_data["macd_line"][i-1]
            signals_df.loc[i, 'signal_2'] = (
                (peak_value > 0) &
                (macd_data["macd_line"][i] <= 0.4 * peak_value) &
                (macd_data["macd_line"][i] > 0)
            )

            # Signal 3: Close price crosses the EMA Midpoint line
            close_below_then_above = (
                (close_prices[i-1] < ema_midpoints[i-1]) &
                (close_prices[i] >= ema_midpoints[i])
            )
            close_above_then_below = (
                (close_prices[i-1] > ema_midpoints[i-1]) &
                (close_prices[i] <= ema_midpoints[i])
            )
            close_proximity = abs(close_prices[i] - ema_midpoints[i]) < (0.001 * close_prices[i])

            signals_df.loc[i, 'signal_3'] = (
                close_below_then_above | close_above_then_below | close_proximity
            )

            # Signal 4: Steep Downtrend with 45-degree angle check
            angle = 0
            if ((macd_data["macd_line"][i] > 0) &
                (macd_data["macd_line"][i] < macd_data["macd_line"][i-1])):
                angle = np.degrees(np.arctan2(
                    float(macd_data["macd_line"][i] - macd_data["macd_line"][i-1]), 1))
                signals_df.loc[i, 'signal_4'] = angle <= -45
            else:
                signals_df.loc[i, 'signal_4'] = False

            # Signal 5: Histogram Weakening
            signals_df.loc[i, 'signal_5'] = (
                (macd_data["histogram"][i] < 0) &
                (macd_data["histogram"][i-1] < 0) &
                (macd_data["histogram"][i-2] < 0) &
                (macd_data["histogram"][i] > macd_data["histogram"][i-1]) &
                (macd_data["histogram"][i-1] > macd_data["histogram"][i-2])
            )

            # Signal 6: MACD Line Turns to Uptrend
            signals_df.loc[i, 'signal_6'] = (
                (macd_data["macd_line"][i] > macd_data["macd_line"][i-1]) &
                (macd_data["macd_line"][i-1] < macd_data["macd_line"][i-2])
            )

            # Signal 7: Bullish Crossover
            signals_df.loc[i, 'signal_7'] = (
                (macd_data["macd_line"][i] > macd_data["signal_line"][i]) &
                (macd_data["macd_line"][i-1] <= macd_data["signal_line"][i-1]) &
                (macd_data["macd_line"][i] < 0)
            )

            # Signal 8: Convergence and Divergence Detection between price and histogram
            if i >= 3:
                current_price = close_prices[i]
                prev_price = close_prices[i-1]
                prev2_price = close_prices[i-2]

                current_hist = macd_data["histogram"][i]
                prev_hist = macd_data["histogram"][i-1]
                prev2_hist = macd_data["histogram"][i-2]

                # Bearish Divergence: Price makes higher high but histogram makes lower high
                price_higher_high = (current_price > prev_price) & (prev_price > prev2_price)
                hist_lower_high = (current_hist < prev_hist) & (prev_hist > prev2_hist) & (current_hist > 0)
                bearish_divergence = price_higher_high & hist_lower_high

                # Bullish Divergence: Price makes lower low but histogram makes higher low
                price_lower_low = (current_price < prev_price) & (prev_price < prev2_price)
                hist_higher_low = (current_hist > prev_hist) & (prev_hist < prev2_hist) & (current_hist < 0)
                bullish_divergence = price_lower_low & hist_higher_low

                # Signal is triggered if either bearish or bullish divergence is detected
                signals_df.loc[i, 'signal_8'] = bearish_divergence | bullish_divergence

        return signals_df
    
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


# Example usage
macd_service = MacdService()
prices = [100, 102, 101, 99, 98, 100, 103, 104, 105]  # Example prices
ema_midpoints = [99, 100, 100.5, 101, 101.2, 101.5, 102, 103, 104]  # Example EMA midpoints

# Calculate MACD data
macd_data = macd_service.calculate_macd(prices)

# Calculate signals
signals = macd_service.calculate_signals(macd_data, prices, ema_midpoints)

print(signals)
