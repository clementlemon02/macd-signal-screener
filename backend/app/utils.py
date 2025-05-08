import yfinance as yf
import pandas as pd
import numpy as np

class MACDSignalDetector:
    def __init__(self, data, fast_period=12, slow_period=26, signal_period=9, long_period=52, short_period=24):

        self.data = data.copy()
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period
        self.long_period = long_period
        self.short_period = short_period

    def calculate_macd(self):
        self.data = self.data.rename(columns=str.lower)

        # Calculate EMAs
        self.data['ema_fast'] = self.data['close'].ewm(span=self.fast_period, adjust=False).mean()
        self.data['ema_slow'] = self.data['close'].ewm(span=self.slow_period, adjust=False).mean()

        #Calculate EMA Midpoint
        self.data['ema_24'] = self.data['close'].ewm(span=self.short_period, adjust=False).mean()
        self.data['ema_52'] = self.data['close'].ewm(span=self.long_period, adjust=False).mean()
        self.data['ema_midpoint'] = (self.data['ema_24'] + self.data['ema_52']) / 2

        # MACD Line and Signal Line
        self.data['macd_line'] = self.data['ema_fast'] - self.data['ema_slow']
        self.data['signal_line'] = self.data['macd_line'].ewm(span=self.signal_period, adjust=False).mean()

        self.data['histogram'] = self.data['macd_line'] - self.data['signal_line']

        return self.data

    def print_signal_details(self):
      print("PRINT SIGNAL DETAILS")
      signal_cols = [f'signal_{i}' for i in range(1, 8)]
      triggered_indices = self.data.index[self.data[signal_cols].any(axis=1)]

      for idx in triggered_indices:
          row = self.data.loc[idx]
          print(f"\n📅 Date: {idx.strftime('%Y-%m-%d')}")
          for signal in signal_cols:
              if row[signal]:
                  print(f"  ⚡ {signal.upper()} TRIGGERED")
                  if signal == 'signal_1':
                      print(f"    • Signal Line ({row['signal_line']:.4f}) > MACD Line ({row['macd_line']:.4f})")
                      print(f"    • Both > 0")

                  elif signal == 'signal_2':
                      i = self.data.index.get_loc(idx)
                      peak = max(self.data['macd_line'].iloc[i-2:i])
                      print(f"    • Peak MACD = {peak:.4f}")
                      print(f"    • Current MACD = {row['macd_line']:.4f} (<= 40% of peak)")

                  elif signal == 'signal_3':
                      i = self.data.index.get_loc(idx)
                      macd_diff = self.data['macd_line'].iloc[i] - self.data['macd_line'].iloc[i-1]
                      angle = np.degrees(np.arctan2(macd_diff, 1))
                      print(f"    • MACD Change = {macd_diff:.4f}")
                      print(f"    • Angle ≈ {angle:.2f}°")

                  elif signal == 'signal_4':
                      print(f"    • Close = {row['close']:.4f}")
                      print(f"    • EMA Midpoint = {row['ema_midpoint']:.4f}")

                  elif signal == 'signal_5':
                      i = self.data.index.get_loc(idx)
                      h_vals = self.data['histogram'].iloc[i-2:i+1].values
                      print(f"    • Histogram: {h_vals[0]:.4f}, {h_vals[1]:.4f}, {h_vals[2]:.4f}")

                  elif signal == 'signal_6':
                      i = self.data.index.get_loc(idx)
                      prev = self.data['macd_line'].iloc[i-2:i+1].values
                      print(f"    • MACD Line: {prev[0]:.4f} → {prev[1]:.4f} → {prev[2]:.4f}")

                  elif signal == 'signal_7':
                      print(f"    • MACD Line = {row['macd_line']:.4f}")
                      print(f"    • Signal Line = {row['signal_line']:.4f} (MACD just crossed above)")


    def detect_signals(self):
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




    def get_signal_summary_table(self):
      def extract_scalar(value):
          return value.item() if isinstance(value, (np.generic, pd.Series)) else value

      signal_stage_map = {
          'signal_1': 1,
          'signal_2': 2,
          'signal_3': 3,
          'signal_4': 4,
          'signal_5': 5,
          'signal_6': 6,
          'signal_7': 7,
      }

      records = []
      for i, row in self.data.iterrows():
          for signal in signal_stage_map:
              if row.get(signal, False):
                  idx = i
                  prev_row = self.data.iloc[self.data.index.get_loc(i) - 1]
                  prev2_row = self.data.iloc[self.data.index.get_loc(i) - 2]

                  records.append({
                      'Time': idx,
                      'Signal': signal,
                      'Cycle_ID': extract_scalar(row.get('meta_cycle_id')),
                      'Source_Condition': extract_scalar(row.get('meta_condition')),

                      'Close': extract_scalar(row.get('close')),
                      'MACD': extract_scalar(row.get('macd_line')),
                      'Signal Line': extract_scalar(row.get('signal_line')),
                      'Histogram': extract_scalar(row.get('histogram')),

                      'Prev_Close': extract_scalar(prev_row.get('close')),
                      'Prev_MACD': extract_scalar(prev_row.get('macd_line')),
                      'Prev_Signal Line': extract_scalar(prev_row.get('signal_line')),
                      'Prev_Histogram': extract_scalar(prev_row.get('histogram')),

                      'Prev2_Close': extract_scalar(prev2_row.get('close')),
                      'Prev2_MACD': extract_scalar(prev2_row.get('macd_line')),
                      'Prev2_Signal Line': extract_scalar(prev2_row.get('signal_line')),
                      'Prev2_Histogram': extract_scalar(prev2_row.get('histogram')),
                  })

      return pd.DataFrame(records)
  
    def fetch_stock_data(symbol='BTC-USD', start='2025-01-01', end='2025-04-01', interval='1d'):
        data = yf.download(tickers=symbol, start=start, end=end, interval=interval, group_by='column')

        # Flatten MultiIndex columns if they exist
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = [col[0] if isinstance(col, tuple) else col for col in data.columns]

        return data

    def main():
        df = fetch_stock_data(symbol='AAPL',start='2024-01-01', end='2025-04-01', interval='1d')

        print(f"Fetched data from {df.index.min().date()} to {df.index.max().date()}")
        print(f"Total data points: {len(df)}")
        detector = MACDSignalDetector(df)
        detector.calculate_macd()
        df_with_signals = detector.detect_signals()
        summary_df = detector.get_signal_summary_table()
        summary_df.to_csv("signal_summary.csv", index=False)
        print("SIGNAL COUNTS")
        detector.print_signal_counts()
        detector.plot_signals()

    if __name__ == "__main__":
        main()