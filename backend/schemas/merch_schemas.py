from pydantic import BaseModel
from typing import Optional

class ProductResponse(BaseModel):
    id: int
    strName: str
    strDescription: str
    numPrice: float
    strCategory: str
    strImage: Optional[str] = None
    boolInStock: bool

    class Config:
        orm_mode = True
