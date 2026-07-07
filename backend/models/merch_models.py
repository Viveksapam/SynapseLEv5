from sqlalchemy import Column, Integer, String, Text, Boolean, Float
from database import Base

class ProductModel(Base):
    __tablename__ = "merch_productmodel"

    id = Column(Integer, primary_key=True, index=True)
    strName = Column(String(150))
    strDescription = Column(Text)
    numPrice = Column(Float)
    strCategory = Column(String(100))
    strImage = Column(String(300), nullable=True)
    boolInStock = Column(Boolean, default=True)
