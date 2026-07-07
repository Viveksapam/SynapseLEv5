from database import engine, SessionLocal
from models.user_models import UserModel
from models.blog_models import Base

def create_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if Vivek exists
    user = db.query(UserModel).filter(UserModel.username == "vivek").first()
    if not user:
        user = UserModel(
            username="vivek",
            password="dummy_password",
            email="vivek@example.com",
            first_name="Vivek",
            last_name="Creator",
            is_active=True,
            is_superuser=True,
            strBio="Creator of VeriSphere."
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created user {user.username} with ID {user.id}")
    else:
        print(f"User {user.username} already exists with ID {user.id}")

    db.close()

    # Also ensure the Synapse AI reviewer account exists.
    from scripts.create_synapse_ai import create_synapse_ai
    create_synapse_ai()

if __name__ == "__main__":
    create_users()
