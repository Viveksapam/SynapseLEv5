import os

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError

from myapps.users.models import UserModel

SYNAPSE_AI_USERNAME = "synapse_ai"


class Command(BaseCommand):
    help = "Create or update the Synapse AI reviewer account."

    def handle(self, *args, **options):
        email = os.environ.get("SYNAPSE_AI_EMAIL", "synapse-ai@synapse.le")
        password = os.environ.get("SYNAPSE_AI_PASSWORD")
        if not password:
            raise CommandError("SYNAPSE_AI_PASSWORD environment variable is required.")
        hashed = make_password(password)

        user = UserModel.objects.filter(username=SYNAPSE_AI_USERNAME).first()
        if user:

            user.password = hashed
            user.email = email
            user.is_active = True
            user.is_staff = True
            user.save()
            self.stdout.write(f"Updated Synapse AI account (id {user.id}, username '{user.username}').")
        else:
            user = UserModel.objects.create(
                username=SYNAPSE_AI_USERNAME, password=hashed, email=email,
                first_name="Synapse", last_name="AI", is_active=True,
                is_staff=True,
                is_superuser=False,
                strBio="Automated trust & safety reviewer for VeriSphere.",
            )
            self.stdout.write(f"Created Synapse AI account (id {user.id}, username '{user.username}').")
        self.stdout.write(f"  login username: {SYNAPSE_AI_USERNAME}")
        self.stdout.write("  password:       (from SYNAPSE_AI_PASSWORD env var)")
