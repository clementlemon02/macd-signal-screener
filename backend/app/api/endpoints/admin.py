from fastapi import APIRouter, HTTPException, status, Body
from typing import Dict
from ...services.supabase_service import supabase

router = APIRouter()

@router.post("/allowed-users", response_model=Dict[str, str])
async def create_allowed_user(user_data: Dict[str, str] = Body(...)):
    """
    Add a new email to the allowed users list.
    """
    email = user_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")

    # Check if email already exists
    result = supabase.table("allowed_users").select("email").eq("email", email).execute()
    if result.data:
        raise HTTPException(status_code=400, detail="Email already in allowed list")

    # Insert email
    insert_result = supabase.table("allowed_users").insert({"email": email}).execute()
    if insert_result.status_code != 201:
        raise HTTPException(status_code=500, detail="Failed to add allowed user")

    return {"message": "User added to allowed list"}


@router.delete("/allowed-users/{email}", response_model=Dict[str, str])
async def delete_allowed_user(email: str):
    """
    Remove an email from the allowed users list.
    """
    # Check if email exists
    result = supabase.table("allowed_users").select("email").eq("email", email).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Email not found in allowed list")

    # Delete email
    delete_result = supabase.table("allowed_users").delete().eq("email", email).execute()
    if delete_result.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to remove allowed user")

    return {"message": "User removed from allowed list"}
