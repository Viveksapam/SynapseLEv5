import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CommunityModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('strName', models.CharField(max_length=255)),
                ('strDescription', models.TextField(blank=True, null=True)),
                ('register', models.CharField(default='library', max_length=20)),
                ('analysis_default', models.BooleanField(default=True)),
                ('dtCreatedAt', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('created_by', models.ForeignKey(blank=True, db_column='created_by', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_communities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'blog_communitymodel',
            },
        ),
    ]
