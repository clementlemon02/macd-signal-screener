from polygon import RESTClient
from app.core.config import settings

# Initialize the RESTClient once and reuse it across the application
client = RESTClient(settings.POLYGON_API_KEY)

async def get_stocks_list():
    try:
        tickers = client.list_tickers(market="stocks", active=True, limit=100)
        return [{"ticker": t.ticker, "name": t.name} for t in tickers]
    except Exception as e:
        raise Exception(f"Error fetching stock list: {str(e)}")

async def get_stock_data(symbol: str, from_date: str, to_date: str):
    try:
        response = client.get_aggs(
            symbol=symbol, 
            timespan="day", 
            from_=from_date, 
            to=to_date
        )
        return response.results
    except Exception as e:
        raise Exception(f"Error fetching stock data for {symbol}: {str(e)}")

async def get_ticker_details(symbol: str):
    try:
        response = client.get_ticker_details(symbol)
        return response
    except Exception as e:
        raise Exception(f"Error fetching ticker details for {symbol}: {str(e)}")
