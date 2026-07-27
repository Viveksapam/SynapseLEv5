import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('posts', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BlogCommentModel',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('strAuthor', models.CharField(default='Anonymous', max_length=255)),
                ('strContent', models.TextField()),
                ('strType', models.CharField(db_index=True, default='standard', max_length=30)),
                ('jsonAnalysisParams', models.TextField(blank=True, null=True)),
                ('jsonAnalysisResult', models.TextField(blank=True, null=True)),
                ('strModelUsed', models.CharField(blank=True, max_length=100, null=True)),
                ('datePosted', models.DateTimeField(default=django.utils.timezone.now)),
                ('blog', models.ForeignKey(db_column='blog_id', on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='posts.blogmodel')),
                ('parent_comment', models.ForeignKey(blank=True, db_column='parent_comment_id', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='comments.blogcommentmodel')),
                ('user', models.ForeignKey(blank=True, db_column='user_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='blog_comments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'blog_blogcommentmodel',
            },
        ),
        migrations.CreateModel(
            name='CommentAnalysisModel',
            fields=[
                ('comment', models.OneToOneField(db_column='comment_id', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='analysis', serialize=False, to='comments.blogcommentmodel')),
                ('ai_summary', models.TextField(blank=True, null=True)),
                ('analyzed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'blog_commentanalysismodel',
            },
        ),
        migrations.CreateModel(
            name='CommentAuditCollectionModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('collected_data', models.TextField(blank=True, null=True)),
                ('llm_response', models.TextField(blank=True, null=True)),
                ('status', models.CharField(default='pending', max_length=50)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('collected_at', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('blog', models.ForeignKey(db_column='blog_id', on_delete=django.db.models.deletion.CASCADE, related_name='comment_audit_collections', to='posts.blogmodel')),
                ('comment', models.ForeignKey(db_column='comment_id', on_delete=django.db.models.deletion.CASCADE, related_name='audit_collections', to='comments.blogcommentmodel')),
            ],
            options={
                'db_table': 'blog_commentauditcollectionmodel',
            },
        ),
    ]
