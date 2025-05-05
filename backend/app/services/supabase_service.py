from supabase import create_client, Client
from ..core.config import settings
from typing import List, Dict, Any
import pandas as pd

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
    
    async def get_stocks(self) -> List[Dict[str, Any]]:
        """Fetch stocks data from Supabase"""
        try:
            response = self.client.table('stocks').select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching stocks: {str(e)}")
            return []
    
    async def get_stock_data(self, symbol: str) -> Dict[str, Any]:
        """Fetch detailed data for a specific stock"""
        try:
            # Get stock basic info
            stock_response = self.client.table('stocks').select("*").eq('symbol', symbol).execute()
            if not stock_response.data:
                return {"error": "Stock not found"}
            
            # Get price history
            price_response = self.client.table('price_history').select("*").eq('symbol', symbol).order('date').execute()
            
            # Get MACD history
            macd_response = self.client.table('macd_history').select("*").eq('symbol', symbol).order('date').execute()
            
            return {
                "stock": stock_response.data[0],
                "price_history": price_response.data,
                "macd_history": macd_response.data
            }
        except Exception as e:
            print(f"Error fetching stock data: {str(e)}")
            return {"error": str(e)}
    
    async def get_signals(self, symbol: str, timeframe: str) -> List[Dict[str, Any]]:
        """Fetch signals for a specific stock and timeframe"""
        try:
            response = self.client.table('signals').select("*").eq('symbol', symbol).eq('timeframe', timeframe).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching signals: {str(e)}")
            return []

# Create a singleton instance
supabase_service = SupabaseService() 