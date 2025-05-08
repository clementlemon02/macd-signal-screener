from typing import List, Dict, Any
import pandas as pd
from datetime import datetime, timedelta
from .twelvedata_service import twelvedata_service
from .batch_macd_service import BatchMacdService
from .supabase_service import supabase_service

class BatchSignalProcessor:
    def __init__(self):
        self.macd_service = BatchMacdService()

    async def process_symbols(self, symbols: List[str], timeframe: str = "1day") -> List[Dict[str, Any]]:
            all_signals = []
            
            # Fetch 100 days of price data for each symbol
            symbol_data_dict = await twelvedata_service.fetch_symbols(
                symbols, interval=timeframe.lower(), outputsize=100
            )

            for symbol in symbols:
                df = symbol_data_dict.get(symbol)
                if df is None or df.empty:
                    continue

                close_prices = df['close'].tolist()
                dates = df.index.strftime('%Y-%m-%d').tolist()
                
                # Calculate MACD, Signal line, and Histogram
                macd_data = self.macd_service.calculate_macd(close_prices, symbol, timeframe, dates)
                
                # Calculate EMA midpoints
                ema_midpoints = self.macd_service.calculate_ema_midpoints(close_prices)
                
                # Detect trading signals based on MACD analysis
                signals = self.macd_service.calculate_signals(macd_data, close_prices, ema_midpoints, symbol, timeframe, dates)
                
                # Add the signal data to the result
                for signal in signals:
                    all_signals.append(signal)

            # Batch insert all collected signals into the database
            if all_signals:
                await supabase_service.insert_macd_signals_batch(all_signals)

            return all_signals



    def _determine_condition(self, signal: Dict[str, Any]) -> str:
        """Determine the market condition based on signals"""
        if signal.get('signal_1'):
            return 'Bearish MACD crossover'
        elif signal.get('signal_7'):
            return 'Bullish MACD crossover'
        elif signal.get('signal_2'):
            return 'Sharp MACD drop'
        elif signal.get('signal_4'):
            return 'Steep MACD downtrend'
        elif signal.get('signal_5'):
            return 'Histogram weakening'
        elif signal.get('signal_6'):
            return 'MACD uptrend'
        elif signal.get('signal_3'):
            return 'Price crossing EMA midpoint'
        return 'No significant condition'

batch_signal_processor = BatchSignalProcessor() 