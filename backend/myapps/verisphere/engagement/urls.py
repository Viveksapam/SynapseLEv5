from django.urls import path

from myapps.verisphere.engagement import views

urlpatterns = [
    path("notifications/", views.list_notifications),
    path("notifications/unread-count/", views.unread_count),
    path("notifications/mark-all-read/", views.mark_all_read),
    path("reputation/me/", views.my_reputation),
    path("badges/me/", views.my_badges),
    path("recap/me/", views.my_recap),
    path("reputation/<str:username>/", views.public_reputation),
]
