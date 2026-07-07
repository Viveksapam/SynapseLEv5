"""Create (or update) the Synapse AI reviewer account.

Synapse AI is the platform's automated trust-and-safety reviewer. It has a real
login account so its source approvals are attributable like any human
moderator's. Credentials come from the environment, falling back to a default
for local/dev use.

Run: python -m scripts.create_synapse_ai   (from the backend/ directory)
"""
import os

from database import engine, SessionLocal
from models.blog_models import Base
from models.user_models import UserModel
from core.security import get_password_hash

SYNAPSE_AI_USERNAME = "synapse_ai"
SYNAPSE_AI_EMAIL = os.environ.get("SYNAPSE_AI_EMAIL", "synapse-ai@synapse.le")
SYNAPSE_AI_PASSWORD = os.environ.get("SYNAPSE_AI_PASSWORD", "synapse-ai-secret")


def _hash_password(raw: str) -> str:
    """Prefer the app's default hasher (bcrypt). Some environments ship a broken
    bcrypt backend; fall back to django_pbkdf2_sha256, which is pure-Python and
    is also in the app's verify context, so logins keep working either way."""
    try:
        return get_password_hash(raw)
    except Exception:
        from passlib.hash import django_pbkdf2_sha256
        return django_pbkdf2_sha256.hash(raw)


def create_synapse_ai():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.username == SYNAPSE_AI_USERNAME).first()
        hashed = _hash_password(SYNAPSE_AI_PASSWORD)
        if user:
            # Keep the account current without clobbering its id.
            user.password = hashed
            user.email = SYNAPSE_AI_EMAIL
            user.is_active = True
            user.is_staff = True
            db.commit()
            print(f"Updated Synapse AI account (id {user.id}, username '{user.username}').")
        else:
            user = UserModel(
                username=SYNAPSE_AI_USERNAME,
                password=hashed,
                email=SYNAPSE_AI_EMAIL,
                first_name="Synapse",
                last_name="AI",
                is_active=True,
                is_staff=True,       # a reviewer, not a full superuser
                is_superuser=False,
                strBio="Automated trust & safety reviewer for VeriSphere.",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created Synapse AI account (id {user.id}, username '{user.username}').")
        print(f"  login username: {SYNAPSE_AI_USERNAME}")
        print(f"  password:       {'(from env)' if os.environ.get('SYNAPSE_AI_PASSWORD') else SYNAPSE_AI_PASSWORD + '  (default — override with SYNAPSE_AI_PASSWORD)'}")
    finally:
        db.close()


if __name__ == "__main__":
    create_synapse_ai()
