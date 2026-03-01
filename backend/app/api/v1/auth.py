import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.utils.auth import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(email=data.email, hashed_password=hash_password(data.password))
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(str(user.id))
        return Token(access_token=token, user=UserResponse.model_validate(user))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Register failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        token = create_access_token(str(user.id))
        return Token(access_token=token, user=UserResponse.model_validate(user))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")
