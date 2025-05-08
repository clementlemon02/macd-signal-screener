from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.supabase_service import supabase_service


router = APIRouter(prefix="/stocks", tags=["stocks"])

@router.get("/")
async def get_stocks() -> List[Dict[str, Any]]:
    """Get list of all stocks with their signals"""
    try:
        stocks = await supabase_service.get_stocks()
        return stocks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}")
async def get_stock(symbol: str) -> Dict[str, Any]:
    """Get detailed data for a specific stock"""
    try:
        data = await supabase_service.get_stock_data(symbol)
        if "error" in data:
            raise HTTPException(status_code=404, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/signals/{timeframe}")
async def get_stock_signals(symbol: str, timeframe: str) -> List[Dict[str, Any]]:
    """Get signals for a specific stock and timeframe"""
    try:
        signals = await supabase_service.get_signals(symbol, timeframe)
        return signals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
