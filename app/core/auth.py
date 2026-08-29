from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    scopes: list[str] = []


class User(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    disabled: bool = False
    scopes: list[str] = []


class UserInDB(User):
    hashed_password: str


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    password: str
    scopes: list[str] = ["read"]


FAKE_USERS_DB: Dict[str, UserInDB] = {}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "access":
            return None
        username: str = payload.get("sub")
        scopes = payload.get("scopes", [])
        if username is None:
            return None
        return TokenData(username=username, scopes=scopes)
    except JWTError:
        return None


def get_user(db: Dict[str, UserInDB], username: str) -> Optional[UserInDB]:
    if username in db:
        return db[username]
    return None


async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = get_user(FAKE_USERS_DB, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception
    user = get_user(FAKE_USERS_DB, token_data.username)
    if user is None:
        raise credentials_exception
    return User(**user.model_dump())


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_scope(required_scope: str):
    async def scope_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if required_scope not in current_user.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required scope: {required_scope}",
            )
        return current_user
    return scope_checker


def create_user(user_data: UserCreate) -> UserInDB:
    hashed_password = get_password_hash(user_data.password)
    user = UserInDB(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        scopes=user_data.scopes,
    )
    FAKE_USERS_DB[user.username] = user
    return user


def init_default_user():
    if "admin" not in FAKE_USERS_DB:
        create_user(UserCreate(
            username="admin",
            email="admin@localhost.com",
            full_name="Admin User",
            password="CHANGE_ME_IN_PRODUCTION",
            scopes=["read", "write", "admin"],
        ))
    if "shrutha" not in FAKE_USERS_DB:
        create_user(UserCreate(
            username="shrutha",
            email="shrutha@localhost.com",
            full_name="Shrutha",
            password="shrutha123",
            scopes=["read", "write", "admin"],
        ))