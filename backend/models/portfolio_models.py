from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from database import Base
import datetime

class SkillModel(Base):
    __tablename__ = "portfolio_skillmodel"

    id = Column(Integer, primary_key=True, index=True)
    strTitle = Column(String(100))
    strThemeColor = Column(String(50), default="#4f46e5")
    strThemeLight = Column(String(50), default="rgba(79, 70, 229, 0.1)")
    strIconSvg = Column(Text, nullable=True)
    strModalHtml = Column(Text, nullable=True)

class VideoModel(Base):
    __tablename__ = "portfolio_videomodel"

    id = Column(Integer, primary_key=True, index=True)
    strTitle = Column(String(200))
    strDescription = Column(Text, nullable=True)
    strYoutubeEmbedUrl = Column(String(200))
    boolIsFeatured = Column(Boolean, default=False)
    dtCreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

class ProjectModel(Base):
    __tablename__ = "project_projectmodel"

    id = Column(Integer, primary_key=True, index=True)
    strName = Column(String(150))
    strDescription = Column(Text)
    strTechStack = Column(String(200))
    strGithubUrl = Column(String(200), nullable=True)
    strLiveUrl = Column(String(200), nullable=True)
    boolIsFeatured = Column(Boolean, default=False)
    strImageUrl = Column(String(500), nullable=True)
    strKickerLabel = Column(String(150), nullable=True)
    strCtaText = Column(String(100), nullable=True)
    strCtaRoute = Column(String(200), nullable=True)
