import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('communities', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ReputationEventModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('event_type', models.CharField(max_length=50)),
                ('weight', models.IntegerField()),
                ('ref_table', models.CharField(blank=True, max_length=50, null=True)),
                ('ref_id', models.IntegerField(blank=True, null=True)),
                ('community_id', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('actor', models.ForeignKey(blank=True, db_column='actor_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reputation_events_caused', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.CASCADE, related_name='reputation_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_reputationeventmodel',
            },
        ),
        migrations.CreateModel(
            name='CommunityMemberModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('role', models.CharField(default='member', max_length=20)),
                ('status', models.CharField(default='active', max_length=20)),
                ('joined_at', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('community', models.ForeignKey(db_column='community_id', on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='communities.communitymodel')),
                ('user', models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.CASCADE, related_name='community_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'community_members',
                'constraints': [models.UniqueConstraint(fields=('community', 'user'), name='uq_member_community_user')],
            },
        ),
        migrations.CreateModel(
            name='NotificationModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('type', models.CharField(max_length=50)),
                ('actor_username', models.CharField(blank=True, max_length=255, null=True)),
                ('blog_id', models.IntegerField(blank=True, null=True)),
                ('ref_table', models.CharField(blank=True, max_length=50, null=True)),
                ('ref_id', models.IntegerField(blank=True, null=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_notificationmodel',
                'indexes': [models.Index(fields=['user', 'read_at'], name='ix_notification_user_read')],
            },
        ),
        migrations.CreateModel(
            name='UserBadgeModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('badge_slug', models.CharField(max_length=50)),
                ('community_id', models.IntegerField(blank=True, null=True)),
                ('ref_table', models.CharField(blank=True, max_length=50, null=True)),
                ('ref_id', models.IntegerField(blank=True, null=True)),
                ('awarded_at', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('user', models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.CASCADE, related_name='badges', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_badges',
                'constraints': [models.UniqueConstraint(fields=('user', 'badge_slug'), name='uq_badge_user_slug')],
            },
        ),
    ]
