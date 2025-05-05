import asyncio
import os
from dotenv import load_dotenv
from app.services.polygon_service import polygon_service

# Load environment variables
load_dotenv()

async def test_polygon_api():
    """Test the Polygon.io API integration"""
    print("Testing Polygon.io API integration...")
    
    # Test API key
    api_key = os.getenv("POLYGON_API_KEY")
    if not api_key:
        print("❌ Error: POLYGON_API_KEY not found in .env file")
        return
    
    print(f"✅ API Key found: {api_key[:5]}...{api_key[-5:]}")
    
    try:
        # Test getting stock data
        print("\nTesting get_stock_data...")
        stock_data = await polygon_service.get_stock_data("AAPL", "2023-10-01", "2023-10-31")
        if stock_data:
            print(f"✅ Successfully retrieved {len(stock_data)} data points for AAPL")
            print(f"Sample data: {stock_data[0]}")
        else:
            print("❌ Failed to retrieve stock data")
        
        # Test getting ticker details
        print("\nTesting get_ticker_details...")
        ticker_details = await polygon_service.get_ticker_details("AAPL")
        if ticker_details:
            print(f"✅ Successfully retrieved ticker details for AAPL")
            print(f"Ticker name: {ticker_details.get('name', 'N/A')}")
        else:
            print("❌ Failed to retrieve ticker details")
        
        # Test getting stocks list
        print("\nTesting get_stocks_list...")
        stocks_list = await polygon_service.get_stocks_list()
        if stocks_list:
            print(f"✅ Successfully retrieved {len(stocks_list)} stocks")
            print(f"Sample stocks: {[stock['ticker'] for stock in stocks_list[:5]]}")
        else:
            print("❌ Failed to retrieve stocks list")
        
        print("\n✅ All Polygon.io API tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing Polygon.io API: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_polygon_api()) 