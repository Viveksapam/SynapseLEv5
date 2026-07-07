from sqlalchemy.orm import Session
from models.portfolio_models import SkillModel, VideoModel, ProjectModel

def get_skills(db: Session, skip: int = 0, limit: int = 100):
    return db.query(SkillModel).offset(skip).limit(limit).all()

def get_videos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(VideoModel).offset(skip).limit(limit).all()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ProjectModel).offset(skip).limit(limit).all()
