import yfinance as yf
import pandas as pd
import time
import json
from typing import List, Dict, Optional
from tqdm import tqdm


class YahooFinanceService:
    def __init__(self, failed_log_file: str = "failed_tickers.json"):
        self.failed_log_file = failed_log_file
        self.failed_tickers = []

    def _download_batch(
        self,
        tickers: List[str],
        period: str,
        interval: str
    ) -> Dict[str, Optional[pd.DataFrame]]:
        data = {ticker: None for ticker in tickers}

        try:
            df = yf.download(
                tickers=tickers,
                period=period,
                interval=interval,
                group_by='ticker',
                threads=False
            )

            if len(tickers) == 1:
                ticker = tickers[0]
                data[ticker] = df if not df.empty else None
                return data

            for ticker in tickers:
                try:
                    if isinstance(df.columns, pd.MultiIndex):
                        if ticker in df.columns.get_level_values(0):
                            ticker_df = df[ticker].dropna().copy()
                            ticker_df.columns.name = None  # remove column name "Price"
                            data[ticker] = ticker_df if not ticker_df.empty else None
                    else:
                        # If not MultiIndex, handle single ticker case
                        ticker_df = df.dropna().copy()
                        data[ticker] = ticker_df if not ticker_df.empty else None
                except Exception as e:
                    print(f"❌ Error processing {ticker} in _download_batch: {e}")
                    data[ticker] = None



        except Exception as e:
            print(f"❌ Error fetching batch {tickers}: {e}")

        return data

    def _save_failed_tickers(self):
        if self.failed_tickers:
            with open(self.failed_log_file, "w") as f:
                json.dump(self.failed_tickers, f, indent=2)
            print(f"⚠️ Failed tickers saved to {self.failed_log_file}")

    def get_historical_data(
        self,
        tickers: List[str],
        period: str = "1mo",
        interval: str = "1d",
        batch_size: int = 10,
        sleep_between_batches: int = 2,
        max_retries: int = 3
    ) -> Dict[str, Optional[pd.DataFrame]]:
        all_data = {}
        tickers_to_process = tickers[:]

        for attempt in range(max_retries):
            print(f"\n🔁 Retry round {attempt + 1} — {len(tickers_to_process)} tickers to fetch")
            self.failed_tickers = []
            pbar = tqdm(range(0, len(tickers_to_process), batch_size), desc="Fetching batches")

            for i in pbar:
                batch = tickers_to_process[i:i + batch_size]
                batch_data = self._download_batch(batch, period, interval)

                for ticker, df in batch_data.items():
                    if df is None or df.empty:
                        self.failed_tickers.append(ticker)
                    else:
                        all_data[ticker] = df

                time.sleep(sleep_between_batches)

            if not self.failed_tickers:
                print("✅ All tickers successfully fetched.")
                break

            tickers_to_process = self.failed_tickers[:]
            self._save_failed_tickers()

        if self.failed_tickers:
            print(f"❌ Final retry failed for {len(self.failed_tickers)} tickers.")
            self._save_failed_tickers()

        return all_data

def main():
    # List of tickers to fetch data for
    tickers = ['AAPL', '2445.KL', 'BTC-USD', 'AMZN', 'TSLA']
    
    # Create an instance of YahooFinanceService
    yahoo_service = YahooFinanceService(failed_log_file="failed_tickers.json")
    
    # Fetch the historical data for the tickers
    print(f"Fetching historical data for {len(tickers)} tickers...")
    all_data = yahoo_service.get_historical_data(
        tickers=tickers,
        period="1mo",        # Last month of data
        interval="1d",       # Daily data points
        batch_size=3,        # Number of tickers per batch
        sleep_between_batches=1,  # 1 second between batch requests
        max_retries=3        # Max 3 retries on failure
    )
    
    # Print the fetched data (or errors)
    if all_data:
        print(f"\nFetched data for {len(all_data)} tickers:")
        for ticker, df in all_data.items():
            print(f"\nData for {ticker}:")
            print(df.head())  # Print the first few rows of data for each ticker
    else:
        print("No data fetched.")
        
    # Check if there are any failed tickers
    if yahoo_service.failed_tickers:
        print(f"\nFailed to fetch data for the following tickers: {yahoo_service.failed_tickers}")
    else:
        print("\nAll tickers successfully fetched.")

if __name__ == "__main__":
    main()