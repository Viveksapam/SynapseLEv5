from myapps.verisphere.sources.models import BlogContextModel, BlogSourceModel


def get_blog_contexts(blog_id: int):
    return list(BlogContextModel.objects.filter(blog_id=blog_id))


def create_blog_context(blog_id: int, title: str, description: str = None):
    return BlogContextModel.objects.create(blog_id=blog_id, strTitle=title, strDescription=description)


def update_blog_context(context_id: int, title: str = None, description: str = None):
    context = BlogContextModel.objects.filter(id=context_id).first()
    if not context:
        return None
    if title:
        context.strTitle = title
    if description is not None:
        context.strDescription = description
    context.save()
    return context


def delete_blog_context(context_id: int) -> bool:
    deleted, _ = BlogContextModel.objects.filter(id=context_id).delete()
    return deleted > 0


def get_context_sources(context_id: int):
    return list(BlogSourceModel.objects.filter(context_id=context_id))


def get_or_create_default_context(blog_id: int):
    context = BlogContextModel.objects.filter(blog_id=blog_id).first()
    if context:
        return context
    return BlogContextModel.objects.create(blog_id=blog_id, strTitle="General")


def get_blog_sources(blog_id: int, status: str = None):
    qs = BlogSourceModel.objects.filter(context__blog_id=blog_id)
    if status:
        qs = qs.filter(review_status=status)
    return list(qs.order_by("-dtCreatedAt"))


def create_source_for_blog(blog_id: int, title: str, url: str, description: str = None, author: str = None):
    context = get_or_create_default_context(blog_id)
    return create_source_in_context(context.id, title, url, description, author)


def create_source_in_context(context_id: int, title: str, url: str, description: str = None, author: str = None):
    return BlogSourceModel.objects.create(
        context_id=context_id, strTitle=title, strUrl=url, strDescription=description, strAuthor=author,
    )


def update_blog_source(source_id: int, title: str = None, url: str = None, author: str = None):
    source = BlogSourceModel.objects.filter(id=source_id).first()
    if not source:
        return None
    if title:
        source.strTitle = title
    if url:
        source.strUrl = url
    if author is not None:
        source.strAuthor = author
    source.save()
    return source


def approve_blog_source(source_id: int, approved_by: str = "admin", approver_name: str = None):
    source = BlogSourceModel.objects.filter(id=source_id).first()
    if not source:
        return None
    source.review_status = "approved"
    source.approved_by = approved_by
    source.approver_name = approver_name
    source.save()
    return source


def delete_blog_source(source_id: int) -> bool:
    deleted, _ = BlogSourceModel.objects.filter(id=source_id).delete()
    return deleted > 0
