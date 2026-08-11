from django.contrib import admin
from django.urls import include, path

from myapps.mainsite.merch import views as merch_views
from myapps.mainsite.portfolio import views as portfolio_views
from myproject import views as myproject_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("myapps.users.urls")),

    path("api/activity/log/", myproject_views.log_activity),

    path("api/portfolio/skills/", portfolio_views.skills),

    path("api/project/", portfolio_views.projects),

    path("api/product/", merch_views.products),


    path("api/verisphere/videos/", portfolio_views.videos),
    path("api/verisphere/", include("myapps.verisphere.urls")),
    path("api/engagement/", include("myapps.verisphere.engagement.urls")),
]
