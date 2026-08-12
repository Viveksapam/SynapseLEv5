from rest_framework.test import APITestCase

from myapps.verisphere.comments.models import BlogCommentModel
from myapps.verisphere.communities.models import CommunityModel
from myapps.verisphere.posts.models import BlogModel
from myapps.users.authentication import create_access_token
from myapps.users.models import UserModel
from django.contrib.auth.hashers import make_password as hash_password


def _make_user(username, **kwargs):
    defaults = {
        "email": f"{username}@example.com", "first_name": "T", "last_name": "U",
        "is_active": True, "password": hash_password("pass12345"),
    }
    defaults.update(kwargs)
    return UserModel.objects.create(username=username, **defaults)


def _auth(user):
    return f"Bearer {create_access_token(user.username)}"


class BlogListTests(APITestCase):
    def test_get_blogs_empty(self):
        response = self.client.get("/api/verisphere/blogs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_get_blogs_shape(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        response = self.client.get("/api/verisphere/blogs/")
        self.assertEqual(response.status_code, 200)
        data = response.json()[0]
        self.assertEqual(data["id"], blog.id)
        self.assertEqual(data["strAuthorUsername"], "System")
        self.assertEqual(data["contexts"], [])
        self.assertEqual(data["sources"], [])


class PostCreateCommentReactTests(APITestCase):
    def setUp(self):
        self.user = _make_user("blogtester")
        self.auth = f"Bearer {create_access_token(self.user.username)}"

    def test_create_post_requires_auth(self):
        response = self.client.post("/api/verisphere/blogs/", {
            "strTitle": "Hello", "strContent": "World",
        }, format="json")
        self.assertEqual(response.status_code, 401)

    def test_create_post_comment_react(self):
        response = self.client.post(
            "/api/verisphere/blogs/", {"strTitle": "Hello", "strContent": "World", "strPostType": "thought"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        blog_id = response.json()["id"]

        response = self.client.post(
            f"/api/verisphere/blogs/{blog_id}/comments/", {"strContent": "Nice"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.post(
            f"/api/verisphere/blogs/{blog_id}/react", {"emoji": "\U0001F44D"},
            format="json", HTTP_AUTHORIZATION=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "added")

        response = self.client.get(f"/api/verisphere/blogs/{blog_id}/reactions")
        self.assertEqual(response.json()["reactions"], {"\U0001F44D": 1})


class CommunityMembershipTests(APITestCase):
    def setUp(self):
        self.creator = _make_user("creator1")
        self.member = _make_user("member1")
        self.creator_auth = f"Bearer {create_access_token(self.creator.username)}"
        self.member_auth = f"Bearer {create_access_token(self.member.username)}"

    def test_create_join_post_ban(self):
        response = self.client.post(
            "/api/verisphere/communities/", {"strName": "TestCommunity", "register": "library"},
            format="json", HTTP_AUTHORIZATION=self.creator_auth,
        )
        self.assertEqual(response.status_code, 200)
        community_id = response.json()["id"]
        self.assertTrue(response.json()["boolCanModerate"])

        response = self.client.post(
            f"/api/verisphere/communities/{community_id}/join", {},
            format="json", HTTP_AUTHORIZATION=self.member_auth,
        )
        self.assertEqual(response.status_code, 200)


        outsider = _make_user("outsider1")
        outsider_auth = f"Bearer {create_access_token(outsider.username)}"
        response = self.client.post(
            "/api/verisphere/blogs/",
            {"strTitle": "T", "strContent": "C", "community_id": community_id},
            format="json", HTTP_AUTHORIZATION=outsider_auth,
        )
        self.assertEqual(response.status_code, 403)


        response = self.client.post(
            "/api/verisphere/blogs/",
            {"strTitle": "T", "strContent": "C", "community_id": community_id},
            format="json", HTTP_AUTHORIZATION=self.member_auth,
        )
        self.assertEqual(response.status_code, 200)


        response = self.client.post(
            f"/api/verisphere/communities/{community_id}/ban/{self.member.id}", {},
            format="json", HTTP_AUTHORIZATION=self.creator_auth,
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.post(
            "/api/verisphere/blogs/",
            {"strTitle": "T2", "strContent": "C2", "community_id": community_id},
            format="json", HTTP_AUTHORIZATION=self.member_auth,
        )
        self.assertEqual(response.status_code, 403)


class AnalysisAsCommentTests(APITestCase):
    def test_off_mode_blocks_analysis_request(self):
        author = _make_user("author1")
        requester = _make_user("requester1")
        blog = BlogModel.objects.create(
            author=author, strTitle="T", strSummary="S", strContent="C", strAnalysisMode="off",
        )
        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/", {"focus": "fact_check"},
            format="json", HTTP_AUTHORIZATION=f"Bearer {create_access_token(requester.username)}",
        )
        self.assertEqual(response.status_code, 403)

    def test_open_mode_analysis_request_mocked(self):
        author = _make_user("author2")
        requester = _make_user("requester2")
        blog = BlogModel.objects.create(
            author=author, strTitle="T", strSummary="S", strContent="C", strAnalysisMode="open",
        )
        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/",
            {"focus": "fact_check", "depth": "quick", "tone": "match"},
            format="json", HTTP_AUTHORIZATION=f"Bearer {create_access_token(requester.username)}",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["deduplicated"])
        self.assertEqual(body["response"]["strType"], "analysis_response")

    def test_limited_mode_restricts_focus(self):
        author = _make_user("author3")
        requester = _make_user("requester3")
        blog = BlogModel.objects.create(
            author=author, strTitle="T", strSummary="S", strContent="C",
            strAnalysisMode="limited", jsonAllowedAnalysisFocus='["sources"]',
        )

        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/", {"focus": "fact_check"},
            format="json", HTTP_AUTHORIZATION=_auth(requester),
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/", {"focus": "sources"},
            format="json", HTTP_AUTHORIZATION=_auth(requester),
        )
        self.assertEqual(response.status_code, 200)

    def test_duplicate_request_same_params_is_deduplicated(self):
        author = _make_user("author4")
        requester = _make_user("requester4")
        blog = BlogModel.objects.create(author=author, strTitle="T", strSummary="S", strContent="C")
        params = {"focus": "fact_check", "depth": "quick", "tone": "match"}
        r1 = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/", params,
            format="json", HTTP_AUTHORIZATION=_auth(requester),
        )
        self.assertEqual(r1.status_code, 200)
        self.assertFalse(r1.json()["deduplicated"])

        r2 = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/", params,
            format="json", HTTP_AUTHORIZATION=_auth(requester),
        )
        self.assertEqual(r2.status_code, 200)
        self.assertTrue(r2.json()["deduplicated"])
        self.assertEqual(r2.json()["request"]["id"], r1.json()["request"]["id"])
        self.assertIsNone(r2.json()["response"])

    def test_daily_request_limit(self):
        author = _make_user("author5")
        requester = _make_user("requester5")
        blog = BlogModel.objects.create(author=author, strTitle="T", strSummary="S", strContent="C")


        for i, tone in enumerate(["match", "formal"] * 3):
            response = self.client.post(
                f"/api/verisphere/blogs/{blog.id}/analysis-requests/",
                {"focus": "fact_check", "depth": "quick", "tone": tone, "custom_instruction": f"v{i}"},
                format="json", HTTP_AUTHORIZATION=_auth(requester),
            )
            if i < 5:
                self.assertEqual(response.status_code, 200, f"request {i} should succeed")
            else:
                self.assertEqual(response.status_code, 429, f"request {i} should be throttled")

    def test_custom_instruction_too_long_rejected(self):
        author = _make_user("author6")
        requester = _make_user("requester6")
        blog = BlogModel.objects.create(author=author, strTitle="T", strSummary="S", strContent="C")
        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/",
            {"focus": "fact_check", "custom_instruction": "x" * 301},
            format="json", HTTP_AUTHORIZATION=_auth(requester),
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_focus_rejected(self):
        author = _make_user("author7")
        requester = _make_user("requester7")
        blog = BlogModel.objects.create(author=author, strTitle="T", strSummary="S", strContent="C")
        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis-requests/", {"focus": "not_a_real_focus"},
            format="json", HTTP_AUTHORIZATION=_auth(requester),
        )
        self.assertEqual(response.status_code, 422)

    def test_analyze_blog_daily_limit(self):
        from myapps.users.models import AnalysisUsageModel
        author = _make_user("author8")
        blog = BlogModel.objects.create(author=author, strTitle="T", strSummary="S", strContent="C")
        for _ in range(5):
            AnalysisUsageModel.objects.create(user_id=author.id)
        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis/", {}, format="json", HTTP_AUTHORIZATION=_auth(author),
        )
        self.assertEqual(response.status_code, 429)

    def test_analyze_blog_populates_flattened_sources_and_contexts(self):
        author = _make_user("author9")
        blog = BlogModel.objects.create(author=author, strTitle="T", strSummary="S", strContent="C")
        from myapps.verisphere.sources.services import create_blog_context
        create_blog_context(blog.id, "Background")
        response = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/analysis/", {}, format="json", HTTP_AUTHORIZATION=_auth(author),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()["ai_summary"])

        self.assertEqual(len(response.json()["contexts"]), 1)


class CommentPermissionTests(APITestCase):
    def setUp(self):
        self.owner = _make_user("commentowner")
        self.other = _make_user("otherperson")
        self.admin = _make_user("commentadmin", is_superuser=True)
        self.blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        self.comment = BlogCommentModel.objects.create(
            blog=self.blog, user=self.owner, strAuthor="commentowner", strContent="original",
        )

    def test_owner_can_edit(self):
        response = self.client.put(
            f"/api/verisphere/blogs/{self.blog.id}/comments/{self.comment.id}",
            {"strContent": "edited"}, format="json", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["strContent"], "edited")

    def test_non_owner_cannot_edit(self):
        response = self.client.put(
            f"/api/verisphere/blogs/{self.blog.id}/comments/{self.comment.id}",
            {"strContent": "hijacked"}, format="json", HTTP_AUTHORIZATION=_auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_can_edit_others_comment(self):
        response = self.client.put(
            f"/api/verisphere/blogs/{self.blog.id}/comments/{self.comment.id}",
            {"strContent": "moderated"}, format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 200)

    def test_community_creator_can_moderate_comment(self):
        creator = _make_user("commcreator")
        community = CommunityModel.objects.create(strName="C1", created_by=creator)
        blog = BlogModel.objects.create(community=community, strTitle="T", strSummary="S", strContent="C")
        comment = BlogCommentModel.objects.create(blog=blog, user=self.other, strAuthor="otherperson", strContent="x")
        response = self.client.delete(
            f"/api/verisphere/blogs/{blog.id}/comments/{comment.id}", HTTP_AUTHORIZATION=_auth(creator),
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(BlogCommentModel.objects.filter(id=comment.id).exists())

    def test_owner_can_delete(self):
        response = self.client.delete(
            f"/api/verisphere/blogs/{self.blog.id}/comments/{self.comment.id}", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 200)

    def test_edit_nonexistent_comment_404(self):
        response = self.client.put(
            f"/api/verisphere/blogs/{self.blog.id}/comments/999999",
            {"strContent": "x"}, format="json", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 404)

    def test_reply_flow(self):
        response = self.client.post(
            f"/api/verisphere/blogs/{self.blog.id}/comments/{self.comment.id}/replies/",
            {"strContent": "a reply"}, format="json", HTTP_AUTHORIZATION=_auth(self.other),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["parent_comment_id"], self.comment.id)

        response = self.client.get(f"/api/verisphere/blogs/{self.blog.id}/comments/{self.comment.id}/replies/")
        self.assertEqual(len(response.json()), 1)


class ReactionLimitTests(APITestCase):
    def test_max_three_reactions_per_user_per_post(self):
        user = _make_user("reactor")
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        emojis = ["\U0001F44D", "\U0001F525", "\U0001F600", "\U0001F602"]
        results = []
        for emoji in emojis:
            response = self.client.post(
                f"/api/verisphere/blogs/{blog.id}/react", {"emoji": emoji},
                format="json", HTTP_AUTHORIZATION=_auth(user),
            )
            results.append(response.json())
        self.assertEqual([r["status"] for r in results[:3]], ["added", "added", "added"])
        self.assertEqual(results[3]["status"], "error")

    def test_toggle_same_emoji_removes_it(self):
        user = _make_user("toggler")
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        r1 = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/react", {"emoji": "\U0001F44D"},
            format="json", HTTP_AUTHORIZATION=_auth(user),
        )
        r2 = self.client.post(
            f"/api/verisphere/blogs/{blog.id}/react", {"emoji": "\U0001F44D"},
            format="json", HTTP_AUTHORIZATION=_auth(user),
        )
        self.assertEqual(r1.json()["status"], "added")
        self.assertEqual(r2.json()["status"], "removed")


class PostUpdateDeleteTests(APITestCase):
    def setUp(self):
        self.owner = _make_user("postowner")
        self.other = _make_user("postother")
        self.admin = _make_user("postadmin", is_superuser=True)
        self.blog = BlogModel.objects.create(author=self.owner, strTitle="Original", strSummary="S", strContent="C")

    def test_non_owner_cannot_update(self):
        response = self.client.patch(
            f"/api/verisphere/blogs/{self.blog.id}/", {"strTitle": "Hijacked"},
            format="json", HTTP_AUTHORIZATION=_auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

    def test_owner_can_update(self):
        response = self.client.patch(
            f"/api/verisphere/blogs/{self.blog.id}/", {"strTitle": "Updated"},
            format="json", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["strTitle"], "Updated")

    def test_empty_title_rejected(self):
        response = self.client.patch(
            f"/api/verisphere/blogs/{self.blog.id}/", {"strTitle": "   "},
            format="json", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_post_type_rejected(self):
        response = self.client.patch(
            f"/api/verisphere/blogs/{self.blog.id}/", {"strPostType": "not_a_type"},
            format="json", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 422)

    def test_non_owner_non_creator_cannot_delete(self):
        response = self.client.delete(
            f"/api/verisphere/blogs/{self.blog.id}", HTTP_AUTHORIZATION=_auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_can_delete(self):
        response = self.client.delete(
            f"/api/verisphere/blogs/{self.blog.id}", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(BlogModel.objects.filter(id=self.blog.id).exists())

    def test_owner_can_delete(self):
        response = self.client.delete(
            f"/api/verisphere/blogs/{self.blog.id}", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 200)

    def test_analysis_settings_update_owner_only(self):
        response = self.client.patch(
            f"/api/verisphere/blogs/{self.blog.id}/analysis-settings/",
            {"strAnalysisMode": "limited", "allowed_analysis_focus": ["sources"]},
            format="json", HTTP_AUTHORIZATION=_auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(
            f"/api/verisphere/blogs/{self.blog.id}/analysis-settings/",
            {"strAnalysisMode": "limited", "allowed_analysis_focus": ["sources"]},
            format="json", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["strAnalysisMode"], "limited")

    def test_limited_mode_requires_focus_list(self):
        response = self.client.patch(
            f"/api/verisphere/blogs/{self.blog.id}/analysis-settings/",
            {"strAnalysisMode": "limited"}, format="json", HTTP_AUTHORIZATION=_auth(self.owner),
        )
        self.assertEqual(response.status_code, 422)


class PostCreateValidationTests(APITestCase):
    def setUp(self):
        self.user = _make_user("createvalidator")

    def test_empty_title_rejected(self):
        response = self.client.post(
            "/api/verisphere/blogs/", {"strTitle": "  ", "strContent": "C"},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_post_type_rejected(self):
        response = self.client.post(
            "/api/verisphere/blogs/", {"strTitle": "T", "strContent": "C", "strPostType": "bogus"},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 422)

    def test_posting_into_nonexistent_community_404(self):
        response = self.client.post(
            "/api/verisphere/blogs/", {"strTitle": "T", "strContent": "C", "community_id": 999999},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 404)

    def test_default_analysis_mode_follows_community_default(self):
        community = CommunityModel.objects.create(strName="ClosedComm", analysis_default=False)
        from myapps.verisphere.engagement.models import CommunityMemberModel
        CommunityMemberModel.objects.create(community=community, user=self.user, status="active")
        response = self.client.post(
            "/api/verisphere/blogs/", {"strTitle": "T", "strContent": "C", "community_id": community.id},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["strAnalysisMode"], "off")

    def test_references_appended_to_content(self):
        response = self.client.post(
            "/api/verisphere/blogs/",
            {"strTitle": "T", "strContent": "C", "strReferences": "https://example.com"},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("https://example.com", response.json()["strContent"])


class ContextSourceTests(APITestCase):
    def setUp(self):
        self.user = _make_user("contextuser")
        self.admin = _make_user("contextadmin", is_superuser=True)
        self.blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")

    def test_create_context_and_source(self):
        response = self.client.post(
            f"/api/verisphere/blogs/{self.blog.id}/contexts/", {"strTitle": "Background"},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        context_id = response.json()["id"]

        response = self.client.post(
            f"/api/verisphere/contexts/{context_id}/sources/",
            {"strTitle": "Some source", "strUrl": "https://example.com"},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["review_status"], "pending")

    def test_approve_source_requires_admin(self):
        response = self.client.post(
            f"/api/verisphere/blogs/{self.blog.id}/sources/",
            {"strTitle": "S", "strUrl": "https://example.com"},
            format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        source_id = response.json()["id"]

        response = self.client.post(
            f"/api/verisphere/sources/{source_id}/approve/", {}, format="json", HTTP_AUTHORIZATION=_auth(self.user),
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.post(
            f"/api/verisphere/sources/{source_id}/approve/", {}, format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["review_status"], "approved")
        self.assertEqual(response.json()["approver_name"], self.admin.username)

    def test_source_status_filter(self):
        from myapps.verisphere.sources.services import create_source_for_blog, approve_blog_source
        s1 = create_source_for_blog(self.blog.id, "Approved one", "https://a.com")
        create_source_for_blog(self.blog.id, "Pending one", "https://b.com")
        approve_blog_source(s1.id, approved_by="admin", approver_name="x")

        response = self.client.get(f"/api/verisphere/blogs/{self.blog.id}/sources/?status=approved")
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["id"], s1.id)


class TrustSurfaceTamperingTests(APITestCase):
    """The 'approved source' badge and AI analysis are the platform's trust signals.

    These endpoints previously accepted anonymous writes, which let anyone forge an AI
    verdict or repoint an already-approved source at another URL while it kept its badge.
    The write paths were removed; these tests keep them from being reintroduced.
    """

    def setUp(self):
        self.user = _make_user("tamperuser")
        self.blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        self.comment = BlogCommentModel.objects.create(
            blog=self.blog, user=self.user, strAuthor=self.user.username, strContent="c",
        )

    def test_source_cannot_be_edited_or_deleted_over_the_api(self):
        from myapps.verisphere.sources.services import approve_blog_source, create_source_for_blog
        source = create_source_for_blog(self.blog.id, "Legit source", "https://trusted.example")
        approve_blog_source(source.id, approved_by="admin", approver_name="admin")

        response = self.client.put(
            f"/api/verisphere/sources/{source.id}",
            {"strTitle": "Legit source", "strUrl": "https://attacker.example"},
            format="json",
        )
        self.assertIn(response.status_code, (404, 405))

        response = self.client.delete(f"/api/verisphere/sources/{source.id}")
        self.assertIn(response.status_code, (404, 405))

        source.refresh_from_db()
        self.assertEqual(source.strUrl, "https://trusted.example")
        self.assertEqual(source.review_status, "approved")

    def test_comment_analysis_is_read_only(self):
        response = self.client.post(
            f"/api/verisphere/comments/{self.comment.id}/analysis/",
            {"ai_summary": "Verified: this claim is 100% accurate."},
            format="json",
        )
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(f"/api/verisphere/comments/{self.comment.id}/analysis/")
        self.assertEqual(response.status_code, 405)

    def test_audit_llm_response_callback_is_gone(self):
        from myapps.verisphere.posts.services import create_audit_collection
        from myapps.verisphere.sources.services import create_source_for_blog

        collection = create_audit_collection(self.blog.id)
        source = create_source_for_blog(self.blog.id, "Unvetted", "https://spam.example")

        response = self.client.post(
            f"/api/verisphere/audit/collections/{collection.id}/llm-response/",
            {"summary": "Fabricated verdict", "approved_source_ids": [source.id]},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

        source.refresh_from_db()
        self.assertEqual(source.review_status, "pending")


class FeaturedAndRecentContributionsTests(APITestCase):
    def setUp(self):
        self.admin = _make_user("featureadmin", is_superuser=True)
        self.plain = _make_user("featureplain")
        self.blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")

    def test_feature_blog_requires_admin(self):
        response = self.client.post(
            f"/api/verisphere/blogs/featured/{self.blog.id}", {}, format="json", HTTP_AUTHORIZATION=_auth(self.plain),
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.post(
            f"/api/verisphere/blogs/featured/{self.blog.id}", {}, format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.get("/api/verisphere/blogs/featured/")
        self.assertEqual(len(response.json()), 1)

        response = self.client.get("/api/verisphere/blogs/")
        self.assertTrue(response.json()[0]["boolIsFeatured"])

    def test_unfeature_blog(self):
        self.client.post(
            f"/api/verisphere/blogs/featured/{self.blog.id}", {}, format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        response = self.client.delete(
            f"/api/verisphere/blogs/featured/{self.blog.id}", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.get("/api/verisphere/blogs/featured/")
        self.assertEqual(response.json(), [])

    def test_recent_contribution_position_swap(self):
        blog2 = BlogModel.objects.create(strTitle="T2", strSummary="S", strContent="C")
        r1 = self.client.post(
            "/api/verisphere/recent-contributions/", {"blog_id": self.blog.id, "position": 1},
            format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(r1.status_code, 200)
        r2 = self.client.post(
            "/api/verisphere/recent-contributions/", {"blog_id": blog2.id, "position": 1},
            format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(r2.status_code, 200)

        response = self.client.get("/api/verisphere/recent-contributions/")
        ids = [b["id"] for b in response.json()]
        self.assertEqual(ids, [blog2.id])

    def test_recent_contributions_requires_admin(self):
        response = self.client.post(
            "/api/verisphere/recent-contributions/", {"blog_id": self.blog.id, "position": 1},
            format="json", HTTP_AUTHORIZATION=_auth(self.plain),
        )
        self.assertEqual(response.status_code, 403)


class CommunityPermissionTests(APITestCase):
    def setUp(self):
        self.creator = _make_user("commpermcreator")
        self.member = _make_user("commpermmember")
        self.outsider = _make_user("commpermoutsider")
        self.community = CommunityModel.objects.create(strName="PermTest", created_by=self.creator)
        from myapps.verisphere.engagement.models import CommunityMemberModel
        CommunityMemberModel.objects.create(community=self.community, user=self.creator, role="creator")

    def test_non_creator_cannot_update_community(self):
        response = self.client.put(
            f"/api/verisphere/communities/{self.community.id}", {"strDescription": "hijacked"},
            format="json", HTTP_AUTHORIZATION=_auth(self.outsider),
        )
        self.assertEqual(response.status_code, 403)

    def test_creator_can_update_community(self):
        response = self.client.put(
            f"/api/verisphere/communities/{self.community.id}", {"strDescription": "updated"},
            format="json", HTTP_AUTHORIZATION=_auth(self.creator),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["strDescription"], "updated")

    def test_invalid_register_rejected(self):
        response = self.client.post(
            "/api/verisphere/communities/", {"strName": "X", "register": "not_a_register"},
            format="json", HTTP_AUTHORIZATION=_auth(self.creator),
        )
        self.assertEqual(response.status_code, 422)

    def test_creator_cannot_leave_own_community(self):
        response = self.client.post(
            f"/api/verisphere/communities/{self.community.id}/leave", {},
            format="json", HTTP_AUTHORIZATION=_auth(self.creator),
        )
        self.assertEqual(response.status_code, 422)

    def test_member_can_leave(self):
        self.client.post(
            f"/api/verisphere/communities/{self.community.id}/join", {},
            format="json", HTTP_AUTHORIZATION=_auth(self.member),
        )
        response = self.client.post(
            f"/api/verisphere/communities/{self.community.id}/leave", {},
            format="json", HTTP_AUTHORIZATION=_auth(self.member),
        )
        self.assertEqual(response.status_code, 200)

    def test_banned_member_rejoining_stays_banned(self):
        self.client.post(
            f"/api/verisphere/communities/{self.community.id}/join", {},
            format="json", HTTP_AUTHORIZATION=_auth(self.member),
        )
        self.client.post(
            f"/api/verisphere/communities/{self.community.id}/ban/{self.member.id}", {},
            format="json", HTTP_AUTHORIZATION=_auth(self.creator),
        )
        response = self.client.post(
            f"/api/verisphere/communities/{self.community.id}/join", {},
            format="json", HTTP_AUTHORIZATION=_auth(self.member),
        )
        self.assertEqual(response.status_code, 403)

    def test_list_members_requires_creator_or_admin(self):
        response = self.client.get(
            f"/api/verisphere/communities/{self.community.id}/members/", HTTP_AUTHORIZATION=_auth(self.outsider),
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.get(
            f"/api/verisphere/communities/{self.community.id}/members/", HTTP_AUTHORIZATION=_auth(self.creator),
        )
        self.assertEqual(response.status_code, 200)

    def test_creator_cannot_be_banned(self):
        response = self.client.post(
            f"/api/verisphere/communities/{self.community.id}/ban/{self.creator.id}", {},
            format="json", HTTP_AUTHORIZATION=_auth(self.creator),
        )
        self.assertEqual(response.status_code, 422)
