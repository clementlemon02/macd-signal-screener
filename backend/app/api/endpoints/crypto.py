from fastapi import APIRouter
from polygon import RESTClient
from app.core.config import settings
import logging

router = APIRouter(prefix="/crypto", tags=["crypto"])

client = RESTClient(settings.POLYGON_API_KEY)

@router.get("/top")
def get_one_crypto():
    """Get a single cryptocurrency ticker with its latest price"""
    try:
        # Get one active crypto ticker
        response = next(client.list_tickers(
            market="crypto",
            active=True,
            order="asc",
            limit=1,  # Just get the first one
            sort="ticker"
        ))

        # Fetch the latest price for the ticker
        ticker = response.ticker
        price_response = client.get_snapshot(ticker)

        latest_price = price_response.latest_trade.price if price_response.latest_trade else "N/A"

        return {
            "symbol": response.ticker,
            "name": response.name,
            "market": response.market,
            "latest_price": latest_price
        }

    except Exception as e:
        err_msg = str(e)
        logging.error(f"[Polygon API Error] {err_msg}")
        return {"error": "An unexpected error occurred while fetching data from Polygon."}
