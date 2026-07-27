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
            name='ReportModel',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('content_type', models.CharField(max_length=20)),
                ('content_id', models.IntegerField(db_index=True)),
                ('reason', models.CharField(max_length=500)),
                ('status', models.CharField(db_index=True, default='open', max_length=20)),
                ('created_at', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('reporter', models.ForeignKey(blank=True, db_column='reporter_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reports_filed', to=settings.AUTH_USER_MODEL)),
                ('resolved_by', models.ForeignKey(blank=True, db_column='resolved_by_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reports_resolved', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'blog_reportmodel',
            },
        ),
    ]
