from supabase import create_client, Client
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()


class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )
    
    async def insert_macd_signal(self, signal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a single MACD signal into the database"""
        try:
            response = self.client.table('macd_signals').insert(signal_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error inserting MACD signal: {str(e)}")
            return None

    async def insert_macd_signals_batch(self, signals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Insert multiple MACD signals into the database"""
        try:
            response = self.client.table('macd_signals').insert(signals).execute()
            return response.data
        except Exception as e:
            print(f"Error inserting MACD signals batch: {str(e)}")
            return []

    async def get_latest_signal_date(self, symbol: str, timeframe: str) -> datetime:
        """Get the date of the latest signal for a symbol and timeframe"""
        try:
            response = self.client.table('macd_signals')\
                .select('date')\
                .eq('symbol', symbol)\
                .eq('timeframe', timeframe)\
                .order('date', desc=True)\
                .limit(1)\
                .execute()
            
            if response.data:
                return datetime.fromisoformat(response.data[0]['date'])
            return datetime.min
        except Exception as e:
            print(f"Error getting latest signal date: {str(e)}")
            return datetime.min

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
        
    async def is_email_allowed(self, email: str) -> bool:
        response = self.client.table("allowed_users").select("email").eq("email", email).execute()
        return len(response.data) > 0

# Create a singleton instance
supabase_service = SupabaseService() 