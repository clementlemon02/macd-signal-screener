from typing import List, Dict, Any
import pandas as pd
from .yf_service import YahooFinanceService
from .batch_macd_service import BatchMacdService
from .supabase_service import supabase_service


class BatchSignalProcessor:
    def __init__(self):
        self.macd_service = BatchMacdService()
        self.finance_service = YahooFinanceService()

        self.SUPPORTED_INTERVALS = {
            "1m", "2m", "5m", "15m", "30m", "60m", "90m",
            "1d", "5d", "1wk", "1mo", "3mo"
        }

        self.RESAMPLE_MAP = {
            "2d": ("1d", "2d"),
            "3d": ("1d", "3d"),
            "2wk": ("1wk", "2w"),
            "3wk": ("1wk", "3w"),
            "2mo": ("1mo", "3m"),
            "4mo": ("1mo", "4m"),
            "5mo": ("1mo", "5m"),
        }
    async def process_symbols(
        self, 
        symbols: List[str], 
        period: str = "3mo", 
        interval: str = "5d", 
        asset_types: Dict[str, str] = None
    ) -> List[Dict[str, Any]]:
        all_signals = []

        # If unsupported interval, fallback to base interval and apply resampling later
        if interval not in self.SUPPORTED_INTERVALS and interval in self.RESAMPLE_MAP:
            base_interval, resample_rule = self.RESAMPLE_MAP[interval]
        else:
            base_interval, resample_rule = interval, None

        symbol_data_dict = self.finance_service.get_historical_data(
            tickers=symbols,
            period=period,
            interval=base_interval
        )

        for symbol in symbols:
            df = symbol_data_dict.get(symbol)
            if df is None or df.empty:
                print(f"⚠️ Skipping {symbol} due to missing data.")
                continue

            # Flatten MultiIndex
            if isinstance(df.columns, pd.MultiIndex):
                try:
                    df = df[symbol]
                    df.columns.name = None
                except Exception as e:
                    print(f"❌ Error flattening MultiIndex for {symbol}: {e}")
                    continue

            if "Close" not in df.columns:
                print(f"❌ 'Close' column not found in {symbol}. Columns: {df.columns}")
                continue

            # Optional: Resample the data if needed
            if resample_rule:
                try:
                    df = df.resample(resample_rule).agg({
                        'Open': 'first',
                        'High': 'max',
                        'Low': 'min',
                        'Close': 'last',
                        'Volume': 'sum'
                    }).dropna()
                except Exception as e:
                    print(f"❌ Resampling failed for {symbol}: {e}")
                    continue

            close_prices = df["Close"].tolist()
            dates = df.index.strftime('%Y-%m-%d').tolist()

            macd_data = self.macd_service.calculate_macd(close_prices, symbol, interval, dates)
            ema_midpoints = self.macd_service.calculate_ema_midpoints(close_prices)

            asset_type = asset_types.get(symbol, 'unknown') if asset_types else 'unknown'

            signals = self.macd_service.calculate_signals(
                macd_data=macd_data,
                close_prices=close_prices,
                ema_midpoints=ema_midpoints,
                symbol=symbol,
                timeframe=interval,
                dates=dates,
                asset_type=asset_type
            )

            all_signals.extend(signals)

        deduped_signals = self.deduplicate_signals(all_signals)
        if deduped_signals:
            await supabase_service.insert_macd_signals_batch(deduped_signals)

        return deduped_signals

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
    
    @staticmethod
    def deduplicate_signals(signals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        unique_keys = set()
        deduped = []

        for signal in signals:
            key = (signal['symbol'], signal['timeframe'], signal['date'])
            if key not in unique_keys:
                unique_keys.add(key)
                deduped.append(signal)
        return deduped


batch_signal_processor = BatchSignalProcessor()
