import sqlalchemy as sa
from database import engine
with engine.connect() as conn:
    print(conn.execute(sa.text('SELECT id, "numUpvotes", comments_count FROM blog_blogmodel')).fetchall())
