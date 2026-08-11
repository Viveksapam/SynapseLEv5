from django.db import migrations


def rename_musing_to_thought(apps, schema_editor):
    BlogModel = apps.get_model("posts", "BlogModel")
    BlogModel.objects.filter(strPostType="musing").update(strPostType="thought")


def rename_thought_to_musing(apps, schema_editor):
    BlogModel = apps.get_model("posts", "BlogModel")
    BlogModel.objects.filter(strPostType="thought").update(strPostType="musing")


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(rename_musing_to_thought, rename_thought_to_musing),
    ]
