from typing import Optional
from sqlalchemy.orm import Session
from .models import AllowedUser

def is_email_allowed(db: Session, email: str) -> bool:
    """
    Check if an email is in the allowed_users table.
    """
    allowed_user = db.query(AllowedUser).filter(AllowedUser.email == email).first()
    return allowed_user is not None

def add_allowed_user(db: Session, email: str) -> Optional[AllowedUser]:
    """
    Add a new email to the allowed_users table.
    """
    try:
        allowed_user = AllowedUser(email=email)
        db.add(allowed_user)
        db.commit()
        db.refresh(allowed_user)
        return allowed_user
    except Exception as e:
        db.rollback()
        print(f"Error adding allowed user: {e}")
        return None

def remove_allowed_user(db: Session, email: str) -> bool:
    """
    Remove an email from the allowed_users table.
    """
    try:
        result = db.query(AllowedUser).filter(AllowedUser.email == email).delete()
        db.commit()
        return result > 0
    except Exception as e:
        db.rollback()
        print(f"Error removing allowed user: {e}")
        return False 