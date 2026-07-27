from django.contrib.auth.models import AbstractUser
from django.db import models


class UserModel(AbstractUser):

    class Meta:
        db_table = "user_usermodel"

    id = models.BigAutoField(primary_key=True)



    email = models.EmailField(unique=True)

    strBio = models.TextField(null=True, blank=True)


    strProfilePicUrl = models.CharField(max_length=200, null=True, blank=True)

    strVerificationCode = models.CharField(max_length=6, null=True, blank=True)


    password_reset_requested_at = models.DateTimeField(null=True, blank=True)
    password_reset_attempts = models.IntegerField(default=0)



    notify_replies = models.BooleanField(default=True)
    notify_reactions = models.BooleanField(default=True)
    notify_analysis = models.BooleanField(default=True)


class PendingUserModel(models.Model):

    class Meta:
        db_table = "user_pendingusermodel"

    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    first_name = models.CharField(max_length=150, null=True, blank=True)
    last_name = models.CharField(max_length=150, null=True, blank=True)
    strVerificationCode = models.CharField(max_length=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    verification_attempts = models.IntegerField(default=0)


class AnalysisUsageModel(models.Model):

    class Meta:
        db_table = "user_analysisusagemodel"

    id = models.BigAutoField(primary_key=True)
    user_id = models.BigIntegerField(db_index=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
