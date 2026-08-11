from django.urls import include, path

from myapps.users import views

urlpatterns = [
    path("", include("djoser.urls")),
    path("", include("djoser.urls.jwt")),
    path("deactivate", views.deactivate),
]
