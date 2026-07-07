from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from crud import crud_portfolio
from schemas.portfolio_schemas import ProjectResponse

router = APIRouter(prefix="/api/project", tags=["Project"])

@router.get("/", response_model=List[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_portfolio.get_projects(db, skip=skip, limit=limit)
