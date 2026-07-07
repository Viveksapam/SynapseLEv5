from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from crud import crud_portfolio
from schemas.portfolio_schemas import SkillResponse

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

@router.get("/skills/", response_model=List[SkillResponse])
def get_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_portfolio.get_skills(db, skip=skip, limit=limit)
