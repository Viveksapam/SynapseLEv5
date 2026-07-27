from rest_framework.test import APITestCase

from myapps.verisphere.posts.models import BlogModel
from myapps.verisphere.engagement import services
from myapps.verisphere.engagement.models import NotificationModel, ReputationEventModel, UserBadgeModel
from myapps.users.authentication import create_access_token
from myapps.users.models import UserModel
from myapps.users.passwords import hash_password


def _make_user(username, **kwargs):
    defaults = {
        "email": f"{username}@example.com", "first_name": "T", "last_name": "U",
        "is_active": True, "password": hash_password("pass12345"),
    }
    defaults.update(kwargs)
    return UserModel.objects.create(username=username, **defaults)


def _auth(user):
    return f"Bearer {create_access_token(user.username)}"


class EngagementEndpointTests(APITestCase):
    def setUp(self):
        self.user = _make_user("engtester")
        self.auth = _auth(self.user)

    def test_empty_notifications_and_reputation(self):
        response = self.client.get("/api/engagement/notifications/", HTTP_AUTHORIZATION=self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

        response = self.client.get("/api/engagement/reputation/me/", HTTP_AUTHORIZATION=self.auth)
        self.assertEqual(response.json(), {"total": 0, "by_type": {}})

    def test_notify_engagement_self_action_is_noop(self):
        blog = BlogModel.objects.create(author=self.user, strTitle="T", strSummary="S", strContent="C")
        services.notify_engagement(blog.author_id, self.user, "comment_on_post", blog_id=blog.id)
        self.assertEqual(services.get_unread_count(self.user.id), 0)

    def test_public_reputation_lookup(self):
        response = self.client.get(f"/api/engagement/reputation/{self.user.username}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], self.user.username)

    def test_public_reputation_404_for_missing_user(self):
        response = self.client.get("/api/engagement/reputation/nonexistent_user_xyz/")
        self.assertEqual(response.status_code, 404)

    def test_notifications_require_auth(self):
        response = self.client.get("/api/engagement/notifications/")
        self.assertEqual(response.status_code, 401)


class NotifyEngagementLogicTests(APITestCase):

    def setUp(self):
        self.recipient = _make_user("recipient1")
        self.actor = _make_user("actor1")

    def test_records_reputation_and_notification(self):
        services.notify_engagement(
            self.recipient.id, self.actor, "comment_on_post", blog_id=1, ref_table="comment", ref_id=1,
            reputation_weight=1,
        )
        self.assertEqual(ReputationEventModel.objects.filter(user_id=self.recipient.id).count(), 1)
        self.assertEqual(NotificationModel.objects.filter(user_id=self.recipient.id).count(), 1)

    def test_notification_suppressed_by_preference_reputation_still_recorded(self):
        self.recipient.notify_replies = False
        self.recipient.save()
        services.notify_engagement(
            self.recipient.id, self.actor, "comment_on_post", blog_id=1, ref_table="comment", ref_id=1,
            reputation_weight=1,
        )
        self.assertEqual(ReputationEventModel.objects.filter(user_id=self.recipient.id).count(), 1)
        self.assertEqual(NotificationModel.objects.filter(user_id=self.recipient.id).count(), 0)

    def test_reaction_removed_never_notifies_even_with_weight(self):
        services.notify_engagement(
            self.recipient.id, self.actor, "reaction_removed", blog_id=1, ref_table="post", ref_id=1,
            reputation_weight=-1,
        )

        self.assertEqual(ReputationEventModel.objects.filter(user_id=self.recipient.id).count(), 1)

        self.assertEqual(NotificationModel.objects.filter(user_id=self.recipient.id).count(), 0)

    def test_no_reputation_weight_means_no_reputation_event(self):
        services.notify_engagement(self.recipient.id, self.actor, "comment_on_post", blog_id=1)
        self.assertEqual(ReputationEventModel.objects.filter(user_id=self.recipient.id).count(), 0)
        self.assertEqual(NotificationModel.objects.filter(user_id=self.recipient.id).count(), 1)

    def test_award_badge_idempotent(self):
        services.award_badge(self.recipient.id, "first_post", "post", 1)
        services.award_badge(self.recipient.id, "first_post", "post", 1)
        self.assertEqual(UserBadgeModel.objects.filter(user_id=self.recipient.id, badge_slug="first_post").count(), 1)

    def test_award_badge_does_not_poison_later_queries(self):
        services.award_badge(self.recipient.id, "curious_mind", "comment", 1)
        services.award_badge(self.recipient.id, "curious_mind", "comment", 1)

        self.assertEqual(UserBadgeModel.objects.filter(user_id=self.recipient.id).count(), 1)


class ReputationSummaryTests(APITestCase):
    def test_reputation_summary_groups_by_type(self):
        user = _make_user("repuser")
        services.record_reputation_event(user.id, None, "reaction_received", 1)
        services.record_reputation_event(user.id, None, "reaction_received", 1)
        services.record_reputation_event(user.id, None, "analysis_favorable", 2)
        summary = services.get_reputation_summary(user.id)
        self.assertEqual(summary["total"], 4)
        self.assertEqual(summary["by_type"], {"reaction_received": 2, "analysis_favorable": 2})

    def test_public_reputation_only_exposes_total_and_badges(self):
        user = _make_user("repuser2")
        services.record_reputation_event(user.id, None, "reaction_received", 1)
        services.award_badge(user.id, "well_sourced")
        response = self.client.get(f"/api/engagement/reputation/{user.username}/")
        self.assertEqual(set(response.json().keys()), {"username", "total", "badges"})
        self.assertEqual(response.json()["badges"], ["well_sourced"])


class NotificationEndpointTests(APITestCase):
    def setUp(self):
        self.user = _make_user("notifuser")
        self.auth = _auth(self.user)

    def test_mark_all_read(self):
        services.create_notification(self.user.id, "comment_on_post", "someone")
        services.create_notification(self.user.id, "reaction_received", "someone")
        response = self.client.get("/api/engagement/notifications/unread-count/", HTTP_AUTHORIZATION=self.auth)
        self.assertEqual(response.json()["count"], 2)

        response = self.client.post("/api/engagement/notifications/mark-all-read/", {}, format="json", HTTP_AUTHORIZATION=self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["marked_read"], 2)

        response = self.client.get("/api/engagement/notifications/unread-count/", HTTP_AUTHORIZATION=self.auth)
        self.assertEqual(response.json()["count"], 0)

    def test_notifications_ordered_newest_first(self):
        n1 = services.create_notification(self.user.id, "comment_on_post", "a")
        n2 = services.create_notification(self.user.id, "reaction_received", "b")
        response = self.client.get("/api/engagement/notifications/", HTTP_AUTHORIZATION=self.auth)
        ids = [n["id"] for n in response.json()]
        self.assertEqual(ids, [n2.id, n1.id])

    def test_recap_counts_recent_activity(self):
        from myapps.verisphere.comments.models import BlogCommentModel
        BlogModel.objects.create(author=self.user, strTitle="T", strSummary="S", strContent="C")
        blog = BlogModel.objects.create(strTitle="T2", strSummary="S", strContent="C")
        BlogCommentModel.objects.create(blog=blog, user=self.user, strAuthor=self.user.username, strContent="x", strType="standard")
        response = self.client.get("/api/engagement/recap/me/", HTTP_AUTHORIZATION=self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["posts"], 1)
        self.assertEqual(response.json()["comments"], 1)


class ReportTests(APITestCase):
    def setUp(self):
        self.admin = _make_user("reportadmin", is_superuser=True)
        self.reporter = _make_user("reporter1")

    def test_admin_only_report_list(self):
        response = self.client.get("/api/verisphere/reports/", HTTP_AUTHORIZATION=_auth(self.reporter))
        self.assertEqual(response.status_code, 403)

    def test_create_report_on_missing_content_404(self):
        response = self.client.post(
            "/api/verisphere/reports/", {"content_type": "post", "content_id": 999999, "reason": "test"},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        self.assertEqual(response.status_code, 404)

    def test_create_report_requires_auth(self):
        response = self.client.post(
            "/api/verisphere/reports/", {"content_type": "post", "content_id": 1, "reason": "test"}, format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_invalid_content_type_rejected(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        response = self.client.post(
            "/api/verisphere/reports/", {"content_type": "bogus", "content_id": blog.id, "reason": "test"},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        self.assertEqual(response.status_code, 422)

    def test_blank_reason_rejected(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        response = self.client.post(
            "/api/verisphere/reports/", {"content_type": "post", "content_id": blog.id, "reason": "   "},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        self.assertEqual(response.status_code, 422)

    def test_duplicate_open_report_is_noop(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        data = {"content_type": "post", "content_id": blog.id, "reason": "spam"}
        r1 = self.client.post("/api/verisphere/reports/", data, format="json", HTTP_AUTHORIZATION=_auth(self.reporter))
        r2 = self.client.post("/api/verisphere/reports/", data, format="json", HTTP_AUTHORIZATION=_auth(self.reporter))
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        self.assertIn("already reported", r2.json()["message"])

        from myapps.verisphere.reports.models import ReportModel
        self.assertEqual(ReportModel.objects.filter(content_type="post", content_id=blog.id).count(), 1)

    def test_resolve_dismiss(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        self.client.post(
            "/api/verisphere/reports/", {"content_type": "post", "content_id": blog.id, "reason": "spam"},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        from myapps.verisphere.reports.models import ReportModel
        report = ReportModel.objects.get(content_id=blog.id)

        response = self.client.post(
            f"/api/verisphere/reports/{report.id}/resolve", {"action": "dismiss"},
            format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 200)
        report.refresh_from_db()
        self.assertEqual(report.status, "dismissed")
        self.assertTrue(BlogModel.objects.filter(id=blog.id).exists())

    def test_resolve_remove_content_deletes_it(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        self.client.post(
            "/api/verisphere/reports/", {"content_type": "post", "content_id": blog.id, "reason": "spam"},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        from myapps.verisphere.reports.models import ReportModel
        report = ReportModel.objects.get(content_id=blog.id)

        response = self.client.post(
            f"/api/verisphere/reports/{report.id}/resolve", {"action": "remove_content"},
            format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 200)
        report.refresh_from_db()
        self.assertEqual(report.status, "removed")
        self.assertFalse(BlogModel.objects.filter(id=blog.id).exists())

    def test_resolve_already_resolved_rejected(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        self.client.post(
            "/api/verisphere/reports/", {"content_type": "post", "content_id": blog.id, "reason": "spam"},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        from myapps.verisphere.reports.models import ReportModel
        report = ReportModel.objects.get(content_id=blog.id)
        report.status = "dismissed"
        report.save()

        response = self.client.post(
            f"/api/verisphere/reports/{report.id}/resolve", {"action": "dismiss"},
            format="json", HTTP_AUTHORIZATION=_auth(self.admin),
        )
        self.assertEqual(response.status_code, 422)

    def test_resolve_requires_admin(self):
        blog = BlogModel.objects.create(strTitle="T", strSummary="S", strContent="C")
        self.client.post(
            "/api/verisphere/reports/", {"content_type": "post", "content_id": blog.id, "reason": "spam"},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        from myapps.verisphere.reports.models import ReportModel
        report = ReportModel.objects.get(content_id=blog.id)

        response = self.client.post(
            f"/api/verisphere/reports/{report.id}/resolve", {"action": "dismiss"},
            format="json", HTTP_AUTHORIZATION=_auth(self.reporter),
        )
        self.assertEqual(response.status_code, 403)
