from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, BigInteger
from database import Base
import datetime

class UserModel(Base):
    __tablename__ = "user_usermodel"

    id = Column(BigInteger, primary_key=True, index=True)
    password = Column(String)
    last_login = Column(DateTime(timezone=True), nullable=True)
    is_superuser = Column(Boolean, default=False)
    username = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    is_staff = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    date_joined = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    
    strBio = Column(Text, nullable=True)
    strProfilePicUrl = Column(Text, nullable=True)
    strVerificationCode = Column(String, nullable=True)
    # Reused for password-reset codes once the account is active (the
    # sign-up verification code is always cleared by then, so no collision).
    password_reset_requested_at = Column(DateTime(timezone=True), nullable=True)
    password_reset_attempts = Column(Integer, nullable=False, default=0)

    # Notification preferences (real user controls - suppress the notification
    # only, never the underlying reputation ledger entry).
    notify_replies = Column(Boolean, nullable=False, default=True)
    notify_reactions = Column(Boolean, nullable=False, default=True)
    notify_analysis = Column(Boolean, nullable=False, default=True)


class PendingUserModel(Base):
    """Holds a registration until its email code is confirmed.

    Keeps unverified sign-ups out of user_usermodel entirely, so an
    abandoned registration never permanently squats a username/email -
    a fresh /register call for the same username just overwrites this row.
    """
    __tablename__ = "user_pendingusermodel"

    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    strVerificationCode = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    # Caps brute-forcing the 6-digit code; a resend resets this to 0.
    verification_attempts = Column(Integer, nullable=False, default=0)


class AnalysisUsageModel(Base):
    """One row per successful 'Analyze'/'Analyze Post' click - the table
    itself is the daily-quota counter, same pattern as the analysis-request
    thread flow in crud_analysis.count_requests_today."""
    __tablename__ = "user_analysisusagemodel"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
