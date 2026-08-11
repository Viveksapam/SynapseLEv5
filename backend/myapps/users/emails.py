from djoser import email as djoser_email


class ActivationEmail(djoser_email.ActivationEmail):
    template_name = "email/synapse_activation.html"


class PasswordResetEmail(djoser_email.PasswordResetEmail):
    template_name = "email/synapse_password_reset.html"
