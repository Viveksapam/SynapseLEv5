from django.db import models
from django.utils import timezone


class CommunityModel(models.Model):

    class Meta:
        db_table = "blog_communitymodel"

    id = models.AutoField(primary_key=True)
    strName = models.CharField(max_length=255)
    strDescription = models.TextField(null=True, blank=True)
    register = models.CharField(max_length=20, default="library")
    analysis_default = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        "users.UserModel", db_column="created_by", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="created_communities",
    )
    dtCreatedAt = models.DateTimeField(null=True, blank=True, default=timezone.now)

    @property
    def member_count(self):
        from myapps.verisphere.engagement.models import CommunityMemberModel
        return CommunityMemberModel.objects.filter(community_id=self.id, status="active").count()
