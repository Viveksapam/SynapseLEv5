from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from crud import crud_merch
from schemas.merch_schemas import ProductResponse

router = APIRouter(prefix="/api/product", tags=["Merchandise"])

@router.get("/", response_model=List[ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_merch.get_products(db, skip=skip, limit=limit)
