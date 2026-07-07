from sqlalchemy.orm import Session
from models.merch_models import ProductModel

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ProductModel).offset(skip).limit(limit).all()
