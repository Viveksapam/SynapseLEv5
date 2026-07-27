from django.urls import path

from myapps.users import views

urlpatterns = [
    path("register", views.register),
    path("verify-email", views.verify_email),
    path("resend-verification", views.resend_verification),
    path("forgot-password", views.forgot_password),
    path("reset-password", views.reset_password),
    path("token", views.token),
    path("me", views.me),
    path("profile", views.profile),
    path("change-password", views.change_password),
    path("settings", views.update_settings),
    path("deactivate", views.deactivate),
]
