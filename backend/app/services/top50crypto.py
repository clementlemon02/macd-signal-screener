import requests
import os
from dotenv import load_dotenv

load_dotenv() 

def get_top_50_crypto_symbols():
    api_key = os.getenv("CMC_API_KEY")
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    headers = {"X-CMC_PRO_API_KEY": api_key}
    params = {"start": "1", "limit": "50", "convert": "USD"}

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()  # Raises an error for bad responses
    data = response.json()

    top_50_symbols = [coin["symbol"] for coin in data["data"]]
    return top_50_symbols

def save_symbols_to_txt(symbols, filename="top_50_crypto.txt"):
    with open(filename, "w") as f:
        for symbol in symbols:
            f.write(symbol + "\n")

if __name__ == "__main__":
    symbols = get_top_50_crypto_symbols()
    save_symbols_to_txt(symbols)
    print(f"Saved {len(symbols)} symbols to top_50_crypto.txt")
