# update_crypto_prices.py

import os
import time
import pandas as pd
from dotenv import load_dotenv
from twelvedata import TDClient
from top50crypto import get_top_50_crypto_symbols 

load_dotenv()

def fetch_crypto_prices(symbols, chunk_size=8):
    td_api_key = os.getenv("TWELVEDATA_API_KEY")
    td = TDClient(apikey=td_api_key)
    all_results = []

    for i in range(0, len(symbols), chunk_size):
        chunk = symbols[i:i+chunk_size]
        print(f"Fetching: {chunk}")
        ts = td.time_series(
            symbol=chunk,
            interval="1day",
            outputsize=1
        )
        try:
            df = ts.as_pandas()
            if isinstance(df, pd.Series):
                df = df.to_frame().T
            df = df['close']
            all_results.append(df)
        except Exception as e:
            print(f"Error fetching data for chunk {chunk}: {e}")
        time.sleep(60)

    return pd.concat(all_results)

def main():
    symbols = get_top_50_crypto_symbols()
    prices_df = fetch_crypto_prices(symbols)
    prices_df.to_csv("top_50_crypto_prices.csv")
    print("Saved prices to top_50_crypto_prices.csv")

if __name__ == "__main__":
    main()
