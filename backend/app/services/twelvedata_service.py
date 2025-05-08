import os
import time
import pandas as pd
import asyncio
from dotenv import load_dotenv
from twelvedata import TDClient
from typing import List, Dict, Any

load_dotenv()

class TwelveDataService:
    def __init__(self):
        self.api_key = os.getenv("TWELVEDATA_API_KEY")
        self.client = TDClient(apikey=self.api_key)
        
    async def fetch_symbols(self, symbols: List[str], interval: str = "1day", outputsize: int = 50, chunk_size: int = 8) -> Dict[str, pd.DataFrame]:
        """Fetch historical data for multiple symbols using batched requests asynchronously"""
        all_results = {}

        # Process the chunks concurrently
        tasks = []
        for i in range(0, len(symbols), chunk_size):
            chunk = symbols[i:i+chunk_size]
            print(f"Fetching: {chunk}")
            tasks.append(self._fetch_chunk(chunk, interval, outputsize, all_results))

        await asyncio.gather(*tasks)
        
        return all_results

    async def _fetch_chunk(self, chunk: List[str], interval: str, outputsize: int, all_results: Dict[str, pd.DataFrame]):
        """Helper function to fetch data for a chunk asynchronously"""
        start_time = time.time()
        try:
            ts = await asyncio.to_thread(self.client.time_series, symbol=chunk, interval=interval, outputsize=outputsize)
            raw_response = ts.as_json()

            data_fetched = False  # Flag to check if any data was fetched
            
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
                    data_fetched = True
                else:
                    print(f"⚠️ No data found for {sym}")

            if data_fetched:
                # Only sleep if data was fetched
                end_time = time.time()
                print(f"Fetching data for chunk {chunk} took {end_time - start_time:.2f} seconds.")

                
            else:
                print(f"❌ No data fetched for chunk {chunk}, skipping sleep.")

        except Exception as e:
            print(f"❌ Error fetching data for chunk {chunk}: {e}")
# Singleton instance
twelvedata_service = TwelveDataService()


# # === Main function for standalone testing ===
# def main():
#     symbols = ["BTC/USD", "ETH/USD"]  # Test symbols
#     data = twelvedata_service.fetch_symbols(symbols)

#     for sym, df in data.items():
#         print(f"\n=== {sym} ===")
#         print(df.head())
#         print(df.index)
#         print(df.dtypes)

# # Entry point
# if __name__ == "__main__":
#     main()
