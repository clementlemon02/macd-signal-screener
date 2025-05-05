from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.services.polygon_service import PolygonService 
from app.services.macd_service import MacdService


# Assuming `MacdService` is already imported

async def fetch_and_process_macd(symbol: str, from_date: str, to_date: str):
    # Step 1: Fetch stock data from PolygonService
    polygon_service = PolygonService()
    stock_data = await polygon_service.get_stock_data(symbol, from_date, to_date)
    
    # Step 2: Extract closing prices from the fetched stock data
    # Assuming stock_data is a list of dicts with 't' (timestamp) and 'c' (close price)
    close_prices = [entry['c'] for entry in stock_data]
    
    # Step 3: Calculate EMA midpoints using the close prices (modify this as needed)
    macd_service = MacdService()
    ema_midpoints = macd_service.calculate_ema_midpoints(close_prices)
    
    # Step 4: Calculate MACD data
    macd_data = macd_service.calculate_macd(close_prices)
    
    # Step 5: Calculate signals based on both close_prices and ema_midpoints
    signals = macd_service.calculate_signals(macd_data, close_prices, ema_midpoints)
    
    # Step 6: Return both MACD data and the signals
    return {
        "macd_data": macd_data,
        "signals": signals
    }

# Example usage
from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")  # Last 30 days
to_date = datetime.now().strftime("%Y-%m-%d")

# Call the async function in an event loop
import asyncio
result = asyncio.run(fetch_and_process_macd('AAPL', from_date, to_date))
print(result)
