# update_crypto_prices.py

import os
import time
import pandas as pd
from dotenv import load_dotenv
from twelvedata import TDClient
from typing import List, Dict, Any

load_dotenv()

class TwelveDataService:
    def __init__(self):
        self.api_key = os.getenv("TWELVEDATA_API_KEY")
        self.client = TDClient(apikey=self.api_key)
        
    def fetch_symbols(self, symbols: List[str], interval: str = "1day", outputsize: int = 50, chunk_size: int = 8) -> Dict[str, pd.DataFrame]:
        """Fetch historical data for multiple symbols using batched requests"""
        all_results = {}

        for i in range(0, len(symbols), chunk_size):
            chunk = symbols[i:i+chunk_size]
            print(f"Fetching: {chunk}")
            try:
                ts = self.client.time_series(
                    symbol=chunk,  
                    interval=interval,
                    outputsize=outputsize
                )
                raw_response = ts.as_json()
                # print("Raw JSON Response:", raw_response)

                for sym in chunk:
                    if sym in raw_response:
                        df = pd.DataFrame(raw_response[sym])

                        if 'datetime' in df.columns:
                            df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')
                            df.set_index('datetime', inplace=True)
                        else:
                            print(f"⚠️ No 'datetime' column found for {sym}")

                        numeric_columns = ['open', 'high', 'low', 'close', 'volume']
                        for col in numeric_columns:
                            if col in df.columns:
                                df[col] = pd.to_numeric(df[col], errors='coerce')

                        all_results[sym] = df
                    else:
                        print(f"⚠️ No data found for {sym}")
            except Exception as e:
                print(f"❌ Error fetching data for chunk {chunk}: {e}")

            time.sleep(60)  # Avoid rate limits
            
            print(all_results)

        return all_results


# Singleton instance
twelvedata_service = TwelveDataService()

# === Main function for standalone testing ===
def main():
    symbols = ["BTC/USD", "ETH/USD"]  # Test symbols
    data = twelvedata_service.fetch_symbols(symbols)

    for sym, df in data.items():
        print(f"\n=== {sym} ===")
        print(df.head())
        print(df.index)
        print(df.dtypes)

# Entry point
if __name__ == "__main__":
    main()
