import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from database import get_db
from models.user_models import UserModel, PendingUserModel
from schemas.user_schemas import Token, UserResponse, UserCreate, UserUpdate, RegisterResponse
from core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from core.deps import get_current_active_user
from core.email import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


class VerifyEmailRequest(BaseModel):
    username: str
    code: str


class ResendCodeRequest(BaseModel):
    username: str


class ForgotPasswordRequest(BaseModel):
    username: str


class ResetPasswordRequest(BaseModel):
    username: str
    code: str
    new_password: str


def _new_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


@router.post("/register", response_model=RegisterResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_email = db.query(UserModel).filter(UserModel.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    code = _new_verification_code()

    # A prior, never-verified attempt with this username/email is just
    # discarded - it never became a real account, so it shouldn't block one.
    db.query(PendingUserModel).filter(
        (PendingUserModel.username == user.username) | (PendingUserModel.email == user.email)
    ).delete(synchronize_session=False)

    pending = PendingUserModel(
        username=user.username,
        email=user.email,
        password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        strVerificationCode=code,
    )
    db.add(pending)
    db.commit()
    send_verification_email(pending.email, f"{pending.first_name} {pending.last_name}", code)
    return {"message": "Check your email for a verification code."}

MAX_VERIFICATION_ATTEMPTS = 5

@router.post("/verify-email", response_model=Token)
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    pending = db.query(PendingUserModel).filter(PendingUserModel.username == body.username).first()
    if not pending:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    if pending.verification_attempts >= MAX_VERIFICATION_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new code and try again.")

    if pending.strVerificationCode != body.code:
        pending.verification_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    new_user = UserModel(
        username=pending.username,
        email=pending.email,
        password=pending.password,
        first_name=pending.first_name,
        last_name=pending.last_name,
        is_active=True,
    )
    db.add(new_user)
    db.delete(pending)
    db.commit()
    db.refresh(new_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": new_user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/resend-verification")
def resend_verification(body: ResendCodeRequest, db: Session = Depends(get_db)):
    pending = db.query(PendingUserModel).filter(PendingUserModel.username == body.username).first()
    if not pending:
        raise HTTPException(status_code=404, detail="No pending registration found for that username")

    code = _new_verification_code()
    pending.strVerificationCode = code
    pending.verification_attempts = 0
    db.commit()
    send_verification_email(pending.email, f"{pending.first_name} {pending.last_name}", code)
    return {"message": "Verification code resent"}

MAX_RESET_ATTEMPTS = 5
RESET_CODE_EXPIRY_MINUTES = 30

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Same response whether or not the account exists - a different message
    # would let an attacker enumerate valid usernames.
    generic_response = {"message": "If that account exists, a reset code has been sent."}

    user = db.query(UserModel).filter(UserModel.username == body.username).first()
    if not user or not user.is_active:
        return generic_response

    code = _new_verification_code()
    user.strVerificationCode = code
    user.password_reset_requested_at = datetime.now(timezone.utc)
    user.password_reset_attempts = 0
    db.commit()
    send_password_reset_email(user.email, f"{user.first_name} {user.last_name}", code)
    return generic_response

@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == body.username).first()
    if (
        not user
        or not user.strVerificationCode
        or not user.password_reset_requested_at
        or datetime.now(timezone.utc) - user.password_reset_requested_at > timedelta(minutes=RESET_CODE_EXPIRY_MINUTES)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if user.password_reset_attempts >= MAX_RESET_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new code and try again.")

    if user.strVerificationCode != body.code:
        user.password_reset_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    user.password = get_password_hash(body.new_password)
    user.strVerificationCode = None
    user.password_reset_requested_at = None
    user.password_reset_attempts = 0
    db.commit()
    return {"message": "Password reset. You can now log in."}

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: UserModel = Depends(get_current_active_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(user_update: UserUpdate, current_user: UserModel = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    if user_update.strBio is not None:
        current_user.strBio = user_update.strBio
    if user_update.strProfilePicUrl is not None:
        current_user.strProfilePicUrl = user_update.strProfilePicUrl

    db.commit()
    db.refresh(current_user)
    return current_user
