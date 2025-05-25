from typing import List, Dict, Any
import pandas as pd
from datetime import datetime, timedelta
from .twelvedata_service import twelvedata_service
from .macd_service import MacdService
from .supabase_service import supabase_service

class SignalProcessor:
    def __init__(self):
        self.macd_service = MacdService()

    async def process_symbols(self, symbols: List[str], timeframe: str = "1day") -> List[Dict[str, Any]]:
        """Process a batch of symbols and generate MACD signals"""
        all_signals = []

        # Fetch all symbol data in batch
        symbol_data_dict = await twelvedata_service.fetch_symbols(symbols, interval=timeframe.lower())

        for symbol in symbols:
            df = symbol_data_dict.get(symbol)
            
            if df is None or df.empty:
                continue

            # Get the latest signal date from the database
            latest_date = await supabase_service.get_latest_signal_date(symbol, timeframe)

            # If there's a latest date, fetch enough historical data to calculate MACD
            if latest_date:
                # Filter data after the latest_date, but always keep enough historical data for MACD calculation
                df = df[df.index >= latest_date]  # Retain only the data after the latest signal date

            # Perform MACD calculations for the available dataset
            close_prices = df['close'].tolist()
            macd_data = self.macd_service.calculate_macd(close_prices)
            ema_midpoints = self.macd_service.calculate_ema_midpoints(close_prices)
            signals = self.macd_service.calculate_signals(macd_data, close_prices, ema_midpoints)

            # Now insert the latest row (the most recent row)
            latest_row_idx = df.index[-1]
            latest_signal = signals[-1]  # Signal for the latest row

            db_signal = {
                'symbol': symbol,
                'asset_type': 'stock',
                'timeframe': timeframe,
                'date': latest_row_idx.strftime('%Y-%m-%d'),
                'close_price': float(df['close'].iloc[-1]),
                'macd_line': float(macd_data['macd_line'][-1]),
                'signal_line': float(macd_data['signal_line'][-1]),
                'macd_histogram': float(macd_data['macd_histogram'][-1]),
                'ema_mid': float(ema_midpoints[-1]),
                'signal_1': bool(latest_signal.get('signal_1', False)),
                'signal_2': bool(latest_signal.get('signal_2', False)),
                'signal_3': bool(latest_signal.get('signal_3', False)),
                'signal_4': bool(latest_signal.get('signal_4', False)),
                'signal_5': bool(latest_signal.get('signal_5', False)),
                'signal_6': bool(latest_signal.get('signal_6', False)),
                'signal_7': bool(latest_signal.get('signal_7', False)),
                'meta_cycle_id': 1,
                'meta_condition': self._determine_condition(latest_signal)
            }

            # Append the signal to the all_signals list
            all_signals.append(db_signal)

        # Batch insert into database
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

signal_processor = SignalProcessor() 