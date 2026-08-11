import datetime
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
            name='BlogModel',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('strTitle', models.CharField(max_length=255)),
                ('strSummary', models.TextField()),
                ('strContent', models.TextField()),
                ('strThemeColor', models.CharField(default='#4f46e5', max_length=50)),
                ('datePublished', models.DateField(default=datetime.date.today)),
                ('strMediaUrl', models.CharField(blank=True, max_length=500, null=True)),
                ('strCategory', models.CharField(blank=True, max_length=50, null=True)),
                ('numReadTime', models.IntegerField(blank=True, null=True)),
                ('numUpvotes', models.IntegerField(blank=True, default=0, null=True)),
                ('comments_count', models.IntegerField(blank=True, default=0, null=True)),
                ('strPostType', models.CharField(default='mixed', max_length=20)),
                ('strAnalysisMode', models.CharField(default='open', max_length=20)),
                ('jsonAllowedAnalysisFocus', models.TextField(blank=True, null=True)),
                ('author', models.ForeignKey(blank=True, db_column='author_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='authored_blogs', to=settings.AUTH_USER_MODEL)),
                ('community', models.ForeignKey(blank=True, db_column='community_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='blogs', to='communities.communitymodel')),
            ],
            options={
                'db_table': 'blog_blogmodel',
            },
        ),
        migrations.CreateModel(
            name='BlogAIAnalysisModel',
            fields=[
                ('blog', models.OneToOneField(db_column='blog_id', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='ai_analysis', serialize=False, to='posts.blogmodel')),
                ('ai_summary', models.TextField(blank=True, null=True)),
                ('ai_context_guardrail', models.TextField(blank=True, null=True)),
                ('analysis_detail', models.TextField(blank=True, null=True)),
                ('analyzed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'blog_blogaianalysismodel',
            },
        ),
        migrations.CreateModel(
            name='FeaturedBlogModel',
            fields=[
                ('blog', models.OneToOneField(db_column='blog_id', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='featured', serialize=False, to='posts.blogmodel')),
            ],
            options={
                'db_table': 'blog_featuredblogmodel',
            },
        ),
        migrations.CreateModel(
            name='BlogAuditCollectionModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('comment_ids', models.TextField(blank=True, null=True)),
                ('source_ids', models.TextField(blank=True, null=True)),
                ('context_ids', models.TextField(blank=True, null=True)),
                ('collected_data', models.TextField(blank=True, null=True)),
                ('llm_response', models.TextField(blank=True, null=True)),
                ('status', models.CharField(blank=True, default='pending', max_length=50, null=True)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('collected_at', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('blog', models.ForeignKey(blank=True, db_column='blog_id', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='audit_collections', to='posts.blogmodel')),
            ],
            options={
                'db_table': 'blog_auditcollectionmodel',
            },
        ),
        migrations.CreateModel(
            name='RecentContributionModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('position', models.IntegerField(unique=True)),
                ('added_at', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('added_by', models.ForeignKey(blank=True, db_column='added_by_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='added_recent_contributions', to=settings.AUTH_USER_MODEL)),
                ('blog', models.ForeignKey(db_column='blog_id', on_delete=django.db.models.deletion.CASCADE, related_name='recent_contribution_slots', to='posts.blogmodel')),
            ],
            options={
                'db_table': 'blog_recentcontributionmodel',
            },
        ),
        migrations.CreateModel(
            name='PostReactionModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('emoji', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('post', models.ForeignKey(blank=True, db_column='post_id', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='posts.blogmodel')),
                ('user', models.ForeignKey(blank=True, db_column='user_id', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='post_reactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'blog_postreactionmodel',
                'constraints': [models.UniqueConstraint(fields=('post', 'user', 'emoji'), name='uq_reaction_post_user_emoji')],
            },
        ),
    ]
