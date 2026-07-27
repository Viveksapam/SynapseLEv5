import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('posts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BlogContextModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('strTitle', models.CharField(blank=True, max_length=255, null=True)),
                ('strDescription', models.TextField(blank=True, null=True)),
                ('dtCreatedAt', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('blog', models.ForeignKey(blank=True, db_column='blog_id', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='contexts', to='posts.blogmodel')),
            ],
            options={
                'db_table': 'blog_blogcontextmodel',
            },
        ),
        migrations.CreateModel(
            name='BlogSourceModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('strTitle', models.TextField(blank=True, null=True)),
                ('strUrl', models.CharField(blank=True, max_length=500, null=True)),
                ('strDescription', models.TextField(blank=True, null=True)),
                ('strAuthor', models.CharField(blank=True, max_length=255, null=True)),
                ('review_status', models.CharField(default='pending', max_length=20)),
                ('approved_by', models.CharField(blank=True, max_length=20, null=True)),
                ('approver_name', models.CharField(blank=True, max_length=100, null=True)),
                ('dtCreatedAt', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('context', models.ForeignKey(blank=True, db_column='context_id', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sources', to='sources.blogcontextmodel')),
            ],
            options={
                'db_table': 'blog_blogsourcemodel',
            },
        ),
    ]
