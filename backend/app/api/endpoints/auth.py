from fastapi import APIRouter, HTTPException, status
from app.services.supabase_service import SupabaseService
from typing import Dict
from pydantic import BaseModel

router = APIRouter()

supabase_service = SupabaseService()



class EmailRequest(BaseModel):
    email: str
@router.post("/check-access", response_model=Dict[str, str])
async def check_access(request: EmailRequest):
    try:
        print(request.email)
        if not await supabase_service.is_email_allowed(request.email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your email is not authorized to access this application"
            )
        return {"status": "success", "message": "Access granted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

