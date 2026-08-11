from django.contrib.auth.models import AbstractUser
from django.db import models


class UserModel(AbstractUser):

    class Meta:
        db_table = "user_usermodel"

    id = models.BigAutoField(primary_key=True)



    email = models.EmailField(unique=True)

    strBio = models.TextField(null=True, blank=True)


    strProfilePicUrl = models.CharField(max_length=200, null=True, blank=True)

    notify_replies = models.BooleanField(default=True)
    notify_reactions = models.BooleanField(default=True)
    notify_analysis = models.BooleanField(default=True)


class AnalysisUsageModel(models.Model):

    class Meta:
        db_table = "user_analysisusagemodel"

    id = models.BigAutoField(primary_key=True)
    user_id = models.BigIntegerField(db_index=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
