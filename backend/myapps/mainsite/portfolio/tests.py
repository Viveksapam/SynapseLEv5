from rest_framework.test import APITestCase

from myapps.mainsite.portfolio.models import SkillModel, VideoModel, ProjectModel


class SkillsEndpointTests(APITestCase):
    def test_get_skills_empty(self):
        response = self.client.get("/api/portfolio/skills/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_get_skills_with_data(self):
        SkillModel.objects.create(strTitle="Python", strThemeColor="#000", strThemeLight="#fff")
        response = self.client.get("/api/portfolio/skills/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["strTitle"], "Python")


    def test_skip_limit_pagination(self):
        for i in range(5):
            SkillModel.objects.create(strTitle=f"Skill{i}", strThemeColor="#000", strThemeLight="#fff")
        response = self.client.get("/api/portfolio/skills/?skip=2&limit=2")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual([d["strTitle"] for d in data], ["Skill2", "Skill3"])


class VideosEndpointTests(APITestCase):
    def test_get_videos(self):
        VideoModel.objects.create(strTitle="Test video", strYoutubeEmbedUrl="https://youtube.com/embed/x")
        response = self.client.get("/api/verisphere/videos/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)


class ProjectsEndpointTests(APITestCase):
    def test_get_projects(self):
        ProjectModel.objects.create(strName="Test project", strDescription="d", strTechStack="Python")
        response = self.client.get("/api/project/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["strName"], "Test project")

    def test_get_projects_empty(self):
        response = self.client.get("/api/project/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])
