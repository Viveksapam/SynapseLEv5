import pytest
from models.portfolio_models import SkillModel

def test_get_skills_empty(client):
    response = client.get("/api/portfolio/skills/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_skills_with_data(client, db_session):
    # Insert dummy skill
    skill = SkillModel(strTitle="Python", strThemeColor="#000", strThemeLight="#fff")
    db_session.add(skill)
    db_session.commit()

    response = client.get("/api/portfolio/skills/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["strTitle"] == "Python"
