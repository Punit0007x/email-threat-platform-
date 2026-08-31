import os
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "users.db")


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
    auth_provider: str = "local"
    avatar_url: Optional[str] = None


class UserInDB(User):
    hashed_password: str


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    password: str
    scopes: list[str] = ["read", "write"]
    auth_provider: str = "local"
    avatar_url: Optional[str] = None


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the SQLite users database schema."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            full_name TEXT,
            hashed_password TEXT,
            disabled INTEGER DEFAULT 0,
            scopes TEXT DEFAULT 'read,write',
            auth_provider TEXT DEFAULT 'local',
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


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


def get_user_from_db(username_or_email: str) -> Optional[UserInDB]:
    """Retrieves a user by username or email from the SQLite database."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT username, email, full_name, hashed_password, disabled, scopes, auth_provider, avatar_url
        FROM users
        WHERE username = ? OR email = ?
    """, (username_or_email, username_or_email))
    row = c.fetchone()
    conn.close()

    if not row:
        return None

    scopes = [s.strip() for s in (row["scopes"] or "read").split(",") if s.strip()]
    return UserInDB(
        username=row["username"],
        email=row["email"],
        full_name=row["full_name"],
        hashed_password=row["hashed_password"] or "",
        disabled=bool(row["disabled"]),
        scopes=scopes,
        auth_provider=row["auth_provider"] or "local",
        avatar_url=row["avatar_url"]
    )


def save_user_to_db(user: UserCreate, hashed_password: str) -> UserInDB:
    """Inserts a new user record into SQLite."""
    conn = get_db_connection()
    c = conn.cursor()
    scopes_str = ",".join(user.scopes)
    c.execute("""
        INSERT INTO users (username, email, full_name, hashed_password, disabled, scopes, auth_provider, avatar_url, last_login)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(username) DO UPDATE SET
            email=excluded.email,
            full_name=excluded.full_name,
            scopes=excluded.scopes,
            auth_provider=excluded.auth_provider,
            last_login=CURRENT_TIMESTAMP
    """, (user.username, user.email, user.full_name, hashed_password, scopes_str, user.auth_provider, user.avatar_url))
    conn.commit()
    conn.close()

    return UserInDB(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        disabled=False,
        scopes=user.scopes,
        auth_provider=user.auth_provider,
        avatar_url=user.avatar_url
    )


def upsert_google_user(email: str, name: str = None, picture: str = None) -> UserInDB:
    """Creates or updates a user authenticated via Google SSO in SQLite."""
    username = email.split("@")[0] if "@" in email else email
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT username, email, full_name, hashed_password, disabled, scopes FROM users WHERE email = ? OR username = ?", (email, username))
    row = c.fetchone()
    
    if row:
        c.execute("""
            UPDATE users SET full_name = ?, avatar_url = ?, auth_provider = 'google', last_login = CURRENT_TIMESTAMP
            WHERE username = ?
        """, (name or row["full_name"], picture, row["username"]))
        conn.commit()
        conn.close()
        scopes = [s.strip() for s in (row["scopes"] or "read").split(",") if s.strip()]
        return UserInDB(
            username=row["username"],
            email=row["email"],
            full_name=name or row["full_name"],
            hashed_password=row["hashed_password"] or "",
            disabled=bool(row["disabled"]),
            scopes=scopes,
            auth_provider="google",
            avatar_url=picture
        )
    else:
        hashed_pwd = get_password_hash("google-sso-authenticated-pass")
        c.execute("""
            INSERT INTO users (username, email, full_name, hashed_password, disabled, scopes, auth_provider, avatar_url, last_login)
            VALUES (?, ?, ?, ?, 0, 'read,write,admin', 'google', ?, CURRENT_TIMESTAMP)
        """, (username, email, name or username.replace(".", " ").title(), hashed_pwd, picture))
        conn.commit()
        conn.close()
        return UserInDB(
            username=username,
            email=email,
            full_name=name or username.replace(".", " ").title(),
            hashed_password=hashed_pwd,
            disabled=False,
            scopes=["read", "write", "admin"],
            auth_provider="google",
            avatar_url=picture
        )


async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = get_user_from_db(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    
    # Update last login timestamp
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?", (user.username,))
    conn.commit()
    conn.close()
    
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
    user = get_user_from_db(token_data.username)
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
    return save_user_to_db(user_data, hashed_password)


def init_default_user():
    """Initializes default users in the SQLite database."""
    init_db()
    
    # Default Admin User
    if not get_user_from_db("admin"):
        create_user(UserCreate(
            username="admin",
            email="admin@security-platform.corp",
            full_name="SOC Administrator",
            password="secret",
            scopes=["read", "write", "admin"],
            auth_provider="local"
        ))

    # Default Analyst User
    if not get_user_from_db("analyst"):
        create_user(UserCreate(
            username="analyst",
            email="analyst@security-platform.corp",
            full_name="Tier-2 Threat Analyst",
            password="secret",
            scopes=["read", "write"],
            auth_provider="local"
        ))

    # Shrutha User
    if not get_user_from_db("shrutha"):
        create_user(UserCreate(
            username="shrutha",
            email="shrutha@localhost.com",
            full_name="Shrutha",
            password="shrutha123",
            scopes=["read", "write", "admin"],
            auth_provider="local"
        ))


# Initialize database schema and seeds on module load
init_default_user()