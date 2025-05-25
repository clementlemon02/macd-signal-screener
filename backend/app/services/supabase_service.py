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

    async def insert_macd_signals_batch(self, signals: List[Dict[str, Any]], batch_size: int = 500):
        for i in range(0, len(signals), batch_size):
            batch = signals[i:i+batch_size]
            try:
                response = self.client.table("macd_signals") \
                    .upsert(batch, on_conflict='symbol,timeframe,date') \
                    .execute()
                print(f"✅ Inserted batch {i//batch_size + 1}, size: {len(batch)}")
            except Exception as e:
                print(f"❌ Error inserting batch {i//batch_size + 1}: {str(e)}")


    async def get_latest_signal_date(self) -> str:
        """Get the latest signal date from the database"""
        try:
            response = self.client.table('macd_signals') \
                .select('created_at') \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]['created_at']
            return None
        except Exception as e:
            print(f"Error getting latest signal date: {str(e)}")
            return None

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
    
    async def get_last_cycle_state(self, symbol: str, asset_type: str, timeframe: str) -> Dict[str, int]:
        """Retrieve the last cycle ID and step for a symbol/timeframe"""
        try:
            response = self.client.table("macd_cycle_state")\
                .select("last_cycle_id, last_cycle_step")\
                .eq("symbol", symbol)\
                .eq("asset_type", asset_type)\
                .eq("timeframe", timeframe)\
                .limit(1)\
                .execute()
            
            if response.data:
                return {
                    "last_cycle_id": response.data[0]["last_cycle_id"],
                    "last_cycle_step": response.data[0]["last_cycle_step"]
                }
            else:
                return {
                    "last_cycle_id": 0,
                    "last_cycle_step": 0
                }
        except Exception as e:
            print(f"Error getting last cycle state: {str(e)}")
            return {
                "last_cycle_id": 0,
                "last_cycle_step": 0
            }
            
    async def update_cycle_state(self, symbol: str, asset_type: str, timeframe: str, new_cycle_id: int, new_step: int) -> bool:
        """Update or insert the cycle state for a symbol/timeframe"""
        try:
            response = self.client.table("macd_cycle_state")\
                .upsert({
                    "symbol": symbol,
                    "asset_type": asset_type,
                    "timeframe": timeframe,
                    "last_cycle_id": new_cycle_id,
                    "last_cycle_step": new_step,
                    "updated_at": datetime.utcnow().isoformat()
                })\
                .execute()
            
            return response.status_code in [200, 201]
        except Exception as e:
            print(f"Error updating cycle state: {str(e)}")
            return False



# Create a singleton instance
supabase_service = SupabaseService() 