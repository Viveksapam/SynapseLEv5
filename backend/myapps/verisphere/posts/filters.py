import django_filters

from myapps.verisphere.posts.models import BlogModel


class BlogFilterSet(django_filters.FilterSet):
    class Meta:
        model = BlogModel
        fields = {
            "strPostType": ["exact"],
            "strCategory": ["exact"],
            "community": ["exact"],
            "author": ["exact"],
        }


class BlogListView:
    """Attribute holder passed to DRF filter backends outside a class-based view."""

    filterset_class = BlogFilterSet
    ordering_fields = ["id", "datePublished", "numUpvotes"]
    ordering = ["-id"]
