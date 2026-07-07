from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    strBio: Optional[str] = None
    strProfilePicUrl: Optional[str] = None

class UserCreate(UserBase):
    # DB columns are NOT NULL, so registration must always supply these -
    # override UserBase's optional fields with required, validated ones.
    first_name: str
    last_name: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, - and _")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_blank(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("This field cannot be blank")
        return v

    @field_validator("password")
    @classmethod
    def password_strong_enough(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    strBio: Optional[str] = None
    strProfilePicUrl: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_staff: bool
    is_superuser: bool
    date_joined: datetime
    last_login: Optional[datetime] = None
    notify_replies: bool = True
    notify_reactions: bool = True
    notify_analysis: bool = True

    class Config:
        orm_mode = True
        from_attributes = True

class RegisterResponse(BaseModel):
    message: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
