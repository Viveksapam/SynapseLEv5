from database import engine, SessionLocal
from models.blog_models import PostReactionModel, BlogModel
from models.user_models import UserModel
from sqlalchemy import text
import datetime

def seed_reactions():
    db = SessionLocal()
    
    # We will use system users or create dummy users to seed the counts.
    # The counts are:
    # 1004: 🤯 45, 🐔 95, 🥚 212
    # 1002: 🤔 89, 💔 12
    # Others: 🔥 15, 🚀 8
    
    # Actually, we don't need to create 200 users, we can just insert rows.
    # But wait, user_id is a foreign key, so we need that many users...
    # That's too much. Let's just create a few users.
    # Or, the UI merges mock data. If the UI merges, then the mock data stays!
    # Wait, in the UI:
    # setReactions(prev => ({ ...prev, ...data.reactions }));
    # This means if `data.reactions` is empty, it uses `prev` which has the mocks!
    # So the mocks WILL display. But if `data.reactions` has `{'🥚': 1}` from Vivek clicking it, 
    # it overwrites `prev['🥚'] = 212` with `1`. 
    # That means the reaction count will plummet from 212 to 1 if Vivek clicks it.
    pass

if __name__ == "__main__":
    pass
