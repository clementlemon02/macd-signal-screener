import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_api_endpoints():
    """Test the FastAPI endpoints"""
    print("Testing FastAPI endpoints...")
    
    # Base URL for the API
    base_url = "http://localhost:8000"
    
    try:
        async with httpx.AsyncClient() as client:
            # Test root endpoint
            print("\nTesting root endpoint...")
            response = await client.get(f"{base_url}/")
            if response.status_code == 200:
                print(f"✅ Root endpoint successful: {response.json()}")
            else:
                print(f"❌ Root endpoint failed: {response.status_code}")
            
            # Test stocks endpoint
            print("\nTesting /api/v1/stocks endpoint...")
            response = await client.get(f"{base_url}/api/v1/stocks")
            if response.status_code == 200:
                stocks = response.json()
                print(f"✅ Stocks endpoint successful: Retrieved {len(stocks)} stocks")
                if stocks:
                    print(f"Sample stock: {stocks[0]['symbol']} - {stocks[0]['name']}")
            else:
                print(f"❌ Stocks endpoint failed: {response.status_code}")
                print(f"Error: {response.text}")
            
            # Test specific stock endpoint
            print("\nTesting /api/v1/stocks/AAPL endpoint...")
            response = await client.get(f"{base_url}/api/v1/stocks/AAPL")
            if response.status_code == 200:
                stock = response.json()
                print(f"✅ Specific stock endpoint successful: {stock['symbol']} - {stock['name']}")
                print(f"Price: ${stock['price']}, Change: {stock['change']}%")
                print(f"Signals: {stock['signals'][-1] if stock['signals'] else 'No signals'}")
            else:
                print(f"❌ Specific stock endpoint failed: {response.status_code}")
                print(f"Error: {response.text}")
            
            print("\n✅ All API endpoint tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing API endpoints: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_api_endpoints()) 