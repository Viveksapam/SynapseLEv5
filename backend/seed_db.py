# flake8: noqa: E501
"""
Seed script for Synapse-LE portfolio/business content.

Writes to whatever DATABASE_URL points at (currently Neon Postgres).
Run with:  python seed_db.py

Behaviour:
  - Skills, Videos, Projects, Products: the curated set is the source of
    truth, so each of those tables is reset and re-seeded (they hold no
    user-generated data).
  - Blogs: NON-destructive. The 3 homepage contributions are inserted only if
    missing, then the Featured join table is reset to point at exactly those 3.
    No existing blog / comment / reaction / community data is deleted.
"""

from database import SessionLocal
from models.blog_models import BlogModel, FeaturedBlogModel, RecentContributionModel
from models.portfolio_models import SkillModel, VideoModel, ProjectModel
from models.merch_models import ProductModel


# ---------------------------------------------------------------------------
# Capability icons (rendered into the ath-carousel via SkillModel.strIconSvg).
# Plain SVG markup so the frontend can inject it with dangerouslySetInnerHTML.
# fill/stroke use currentColor so they inherit the carousel/modal text color.
# ---------------------------------------------------------------------------
ICON_FRONTEND = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(90 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(150 12 12)"/></svg>'
ICON_STYLING = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 0h21l-1.91 21.563L12 24l-8.59-2.438L1.5 0zm17.072 6.25H5.06l.444 5h10.816l-.444 5-5.904 1.63-5.903-1.63-.382-4.3H3.21l.666 7.5 8.124 2.25 8.124-2.25 1.07-12.062-.572-1.188z"/></svg>'
ICON_BACKEND = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.923 1.586H11.23v20.828h1.693V1.586zm5.82 5.093c-.947-.638-2.234-.959-3.864-.959v2.545c.895 0 1.564.168 2.006.505.44.336.662.884.662 1.644v1.89h-2.668c-1.442 0-2.527.323-3.255.972-.729.648-1.093 1.554-1.093 2.716 0 1.093.336 1.947 1.008 2.563.673.616 1.576.924 2.708.924 1.258 0 2.366-.505 3.325-1.515v1.272h1.693V10.42c0-1.637-.47-2.886-1.522-3.741zm-.522 7.828c-.378.503-.923.755-1.638.755-.472 0-.853-.134-1.144-.403-.29-.268-.436-.638-.436-1.109 0-.528.187-.927.563-1.197.375-.27.97-.406 1.785-.406h.87v2.36zM5.385 7.643c-.887 0-1.567.332-2.038.995v-.838H1.654v14.028h1.692V14.15c.47.663 1.15 1.002 2.039 1.002 1.25 0 2.277-.52 3.08-1.563.805-1.042 1.206-2.457 1.206-4.246 0-1.8-.401-3.218-1.206-4.253-.803-1.035-1.83-1.553-3.08-1.553zm-.212 6.079c-.503 0-.917-.184-1.242-.553-.325-.37-.488-.91-.488-1.623 0-.72.163-1.264.488-1.633.325-.37.739-.555 1.242-.555.51 0 .927.185 1.253.555.326.37.49.913.49 1.633 0 .713-.164 1.253-.49 1.623-.326.37-.743.553-1.253.553z"/></svg>'
ICON_LXD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>'
ICON_STATE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm11.39 12.03c.53.5 1.13.78 1.96.78 1.1 0 1.77-.57 1.77-1.39 0-1-.87-1.28-1.99-1.74l-.56-.22c-1.61-.64-2.43-1.63-2.43-2.99 0-1.61 1.3-2.83 3.32-2.83 1.34 0 2.37.39 3.07 1.12l-1.32 1.54c-.45-.44-1.02-.74-1.7-.74-1 0-1.56.5-1.56 1.18 0 .89.8 1.14 1.84 1.54l.58.22c1.78.68 2.58 1.63 2.58 3.12 0 1.81-1.37 2.99-3.5 2.99-1.84 0-3.08-.68-3.95-1.56l1.39-1.62zm-6.02 1.48c-.5.48-1.12.78-1.88.78-.96 0-1.65-.48-1.92-1.3l-1.78.64c.54 1.58 1.94 2.56 3.8 2.56 1.92 0 3.65-1.08 3.65-3.32V7.12H8.35v7.26c0 .64-.17 1.36-.63 1.83z"/></svg>'
ICON_API = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.914 0C5.352 0 5.618 2.84 5.618 2.84l.006 2.946h6.398v.9h-8.9s-3.056.326-3.056 5.8c0 5.47 2.65 5.666 2.65 5.666h1.584v-2.235s-.08-2.678 2.604-2.678h6.242s2.834-.052 2.834-2.825V4.686s.316-4.686-5.834-4.686zm-3.532 2.025c.637 0 1.152.515 1.152 1.151 0 .637-.515 1.152-1.152 1.152-.636 0-1.151-.515-1.151-1.152 0-.636.515-1.151 1.151-1.151zm7.658 21.95c-.637 0-1.152-.515-1.152-1.151 0-.637.515-1.152 1.152-1.152.636 0 1.151.515 1.151 1.152 0 .636-.515 1.151-1.151 1.151z"/></svg>'


def _modal(short, bullets):
    items = "".join(f"<li>{b}</li>" for b in bullets)
    return f'<p>{short}</p><ul>{items}</ul>'


# ---------------------------------------------------------------------------
# Curated content
# ---------------------------------------------------------------------------
ARR_SKILLS = [
    {
        "strTitle": "Frontend Architecture & React",
        "strThemeColor": "#2563eb",
        "strThemeLight": "rgba(37, 99, 235, 0.1)",
        "strIconSvg": ICON_FRONTEND,
        "strModalHtml": _modal(
            "Building scalable, modular web applications with modern state management.",
            [
                "React modular component design & custom hooks",
                "Advanced state management (Redux Toolkit, Context API)",
                "Performance optimization (code splitting, memoization)",
            ],
        ),
    },
    {
        "strTitle": "UI Engineering & Styling",
        "strThemeColor": "#7c3aed",
        "strThemeLight": "rgba(124, 58, 237, 0.1)",
        "strIconSvg": ICON_STYLING,
        "strModalHtml": _modal(
            "Crafting responsive, pixel-perfect user interfaces with a focus on maintainability.",
            [
                "Design tokens & scalable styling systems",
                "CSS Modules & BEM methodology for scoping",
                "Responsive layouts using CSS Grid & Flexbox",
            ],
        ),
    },
    {
        "strTitle": "Backend Development & FastAPI",
        "strThemeColor": "#059669",
        "strThemeLight": "rgba(5, 150, 105, 0.1)",
        "strIconSvg": ICON_BACKEND,
        "strModalHtml": _modal(
            "Developing robust API services and managing database schemas.",
            [
                "FastAPI REST framework implementation",
                "JWT authentication & token handling",
                "SQLite & PostgreSQL database management",
            ],
        ),
    },
    {
        "strTitle": "Learning Experience Design",
        "strThemeColor": "#e11d48",
        "strThemeLight": "rgba(225, 29, 72, 0.1)",
        "strIconSvg": ICON_LXD,
        "strModalHtml": _modal(
            "Applying instructional design methods to build effective educational software.",
            [
                "Cognitive load theory application",
                "Scaffolding & feedback loops",
                "Educational user testing",
            ],
        ),
    },
    {
        "strTitle": "State Management",
        "strThemeColor": "#d97706",
        "strThemeLight": "rgba(217, 119, 6, 0.1)",
        "strIconSvg": ICON_STATE,
        "strModalHtml": _modal(
            "Managing global app state cleanly and predictably across render layers.",
            [
                "Redux Toolkit slices & thunks",
                "Zustand lightweight stores",
                "Context API for scoping",
            ],
        ),
    },
    {
        "strTitle": "APIs & Data Syncing",
        "strThemeColor": "#0891b2",
        "strThemeLight": "rgba(8, 145, 178, 0.1)",
        "strIconSvg": ICON_API,
        "strModalHtml": _modal(
            "Establishing clean, real-time channels between React clients and server backends.",
            [
                "Fetch / Axios layers with error handling",
                "WebSocket integrations for live feeds",
                "Query serialization & caching policies",
            ],
        ),
    },
]

# Videos: the real links are preserved exactly; only moved out of the
# hardcoded frontend array and into the portfolio_videomodel table.
ARR_VIDEOS = [
    {
        "strTitle": "Miley Cyrus - The Climb",
        "strDescription": "Official Music Video for The Climb by Miley Cyrus",
        "strYoutubeEmbedUrl": "https://www.youtube.com/embed/oMeSf6d4Xrg",
        "boolIsFeatured": True,
    },
    {
        "strTitle": "Adele - Hello",
        "strDescription": "Official Music Video for Hello by Adele",
        "strYoutubeEmbedUrl": "https://www.youtube.com/embed/YQHsXMglC9A",
        "boolIsFeatured": False,
    },
    {
        "strTitle": "Clean Bandit - Rockabye",
        "strDescription": "Official Music Video for Rockabye by Clean Bandit",
        "strYoutubeEmbedUrl": "https://www.youtube.com/embed/papuvlVeZg8",
        "boolIsFeatured": False,
    },
    {
        "strTitle": "Jessie J - Flashlight",
        "strDescription": "Official Music Video for Flashlight by Jessie J",
        "strYoutubeEmbedUrl": "https://www.youtube.com/embed/D-NvQ6VJYtE",
        "boolIsFeatured": False,
    },
]

ARR_PROJECTS = [
    {
        "strName": "Verisphere",
        "strDescription": "A community platform for verifiable, source-backed discussion — where every claim carries its provenance and every voice is accountable.",
        "strTechStack": "React,FastAPI,PostgreSQL",
        "strGithubUrl": "https://github.com/Viveksapam",
        "boolIsFeatured": True,
        "strImageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuDUf6hMtCIwoYC5KpIwW2Tx3fRr4yukoMTYIxHGVYy6CkGhsgVvD0husr7Da2JWhR61HLkvxJXfT8qCF6sLu6HemV-t14o7hhQOJKykWkHdANyGKHNabYcxnXafIAn1Ytcw8L8Tf_UIYKmW21yjPt3paI6aiLxAX44UHxxLZn_k8j5DehTSNREYbg3FlN1Qmxiy7JRjYMtkg1DDQ-1EsGTINur054EREJMrNgWe7pTaHAmpC0kkscXWEkTiXidU34reP4JQ6b6tc-K7",
        "strKickerLabel": "TRUST-BASED DISCOURSE",
        "strCtaText": "Experience Verisphere",
        "strCtaRoute": "/verisphere",
    },
    {
        "strName": "Credential Assessment System",
        "strDescription": "Issue, store and verify academic credentials with tamper-evident records and instant institutional lookup.",
        "strTechStack": "React,JWT,SQLite",
        "strGithubUrl": "https://github.com/Viveksapam",
        "boolIsFeatured": True,
        "strImageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuDLR52M2jFaPb_7HgPq4GuHLHP93pj8mrqqT76R02HT5y72HDgQ-rszSTgccLyZ5crkWNKiMHfdFF45h37uklei1Q2ZRB7F0XTJWI0tt5AezNi1LvEK_2g0zikfFKKuDjctUwyTX8Jdp8Nz1Wwhf-fLvcu1MnNoNIaXakVrLoVh-4f6NfUFDJwWdAzw_J1S5oEY5QkEG238oalpYxCCXwCydtdQTRlgmkTUr6tSpn5oOTVGvbuYz4T1VVrzcjW6uqp7_xc5HwyEi9Nf",
        "strKickerLabel": "VERIFIABLE LEARNING",
        "strCtaText": "Open CAS",
        "strCtaRoute": "/credentials",
    },
    {
        "strName": "Spatial Learning Environment",
        "strDescription": "An interactive map that turns a course into a navigable space — rooms, paths and shared discovery.",
        "strTechStack": "Three.js,R3F,WebGL",
        "strGithubUrl": "https://github.com/Viveksapam",
        "boolIsFeatured": True,
        "strImageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuCZ-xrMHOTSyTGEaZCNGiU9gtTYSDojAQACt63gecdlIrSsG55GzaE3bicWwoTNTNAUKFERznT-yjwWHN5RalKznk_NmtOqeYDeUfH3gKx_SYB5RtGhawvD7o7cTe8KP3AUZrY-T69o5ZuM5kC7aCkzjMQu1ojJSMQWw0BxY__wuM5WvttYxSyKhOet10bEzjXqgytwMG_lIwCl0kRHPvPrq1V_bSyLxMB826x1JUbhFSbIPpl7gPsqoWpr9AIO2FuDJfWd-ZklxdOz",
        "strKickerLabel": "CLASSROOM MAP",
        "strCtaText": "Enter the Map",
        "strCtaRoute": "/sle",
    },
]

# Merch: the curated set that used to live as hardcoded arrays in the
# frontend (merchandiseData.js / productApi.js), now moved into the table.
ARR_PRODUCTS = [
    {
        "strName": "Classic Black Developer Tee",
        "strDescription": "Premium 100% cotton black t-shirt. The classic uniform for any serious developer.",
        "numPrice": 999,
        "strCategory": "Apparel",
        "strImage": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop",
    },
    {
        "strName": "Oversized Black Coder Tee",
        "strDescription": "A relaxed, oversized fit black tee for maximum comfort during long debugging sessions.",
        "numPrice": 1299,
        "strCategory": "Apparel",
        "strImage": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop",
    },
    {
        "strName": "Minimalist Syntax Black Tee",
        "strDescription": "Sleek black tee with subtle syntax highlighting elements on the pocket. Understated and professional.",
        "numPrice": 1499,
        "strCategory": "Apparel",
        "strImage": "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=600&auto=format&fit=crop",
    },
    {
        "strName": "Developer Hoodie - Dark Mode",
        "strDescription": "Premium heavyweight cotton hoodie. Perfect for late night coding sessions.",
        "numPrice": 2999,
        "strCategory": "Apparel",
        "strImage": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600",
    },
    {
        "strName": "Mechanical Keyboard Desk Mat",
        "strDescription": "Extra large desk mat with syntax highlight design.",
        "numPrice": 1799,
        "strCategory": "Accessories",
        "strImage": "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=600",
    },
    {
        "strName": "Coffee to Code Mug",
        "strDescription": "Matte black ceramic mug. Essential for turning caffeine into logic.",
        "numPrice": 699,
        "strCategory": "Accessories",
        "strImage": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600",
    },
    {
        "strName": "Syntax Error Sweatpants",
        "strDescription": "Ultimate comfort for debugging from the couch.",
        "numPrice": 1899,
        "strCategory": "Comfort Wear",
        "strImage": "https://images.unsplash.com/photo-1516826957135-700ede19c6ce?auto=format&fit=crop&q=80&w=600",
    },
    {
        "strName": "It Works on My Machine Sticker Pack",
        "strDescription": "High quality vinyl stickers for your laptop.",
        "numPrice": 399,
        "strCategory": "Memes",
        "strImage": "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&q=80&w=600",
    },
]

# Blogs drive the homepage "Recent Contributions". strCategory/numReadTime are
# real columns now (previously guessed on the frontend from strThemeColor).
ARR_BLOGS = [
    {
        "strTitle": "On the Architecture of Trust in Digital Discourse",
        "strSummary": "Why verifiability must be a first-class design primitive, not a moderation afterthought.",
        "strContent": "Trust is not a feature you bolt on after launch. This piece argues that provenance, citation and accountability belong in the data model from day one — and what changes when they do.",
        "strThemeColor": "#3b82f6",
        "strCategory": "Discovery",
        "numReadTime": 12,
    },
    {
        "strTitle": "Verifiability as a Design Principle",
        "strSummary": "Provenance, citation and consent — building social spaces that reward rigor over reach.",
        "strContent": "Provenance, citation and consent are the three pillars of a healthier discourse layer. We look at how each one maps to concrete UI and API decisions in Verisphere.",
        "strThemeColor": "#10b981",
        "strCategory": "Ethics",
        "numReadTime": 8,
    },
    {
        "strTitle": "What Verifiable Discourse Actually Requires",
        "strSummary": "Notes on building social spaces that reward sources over noise.",
        "strContent": "A field guide to the small, unglamorous mechanics — source attachment, claim linking, reaction integrity — that decide whether a community rewards sources or noise.",
        "strThemeColor": "#3b82f6",
        "strCategory": "Discovery",
        "numReadTime": 12,
    },
    {
        "strTitle": "The Ethics of Algorithmic Curation",
        "strSummary": "When feeds decide what is seen, who bears responsibility for what is believed?",
        "strContent": "Curation is never neutral. This post traces the accountability chain from ranking signal to reader belief — and asks what ethical obligations platform designers carry.",
        "strThemeColor": "#10b981",
        "strCategory": "Ethics",
        "numReadTime": 8,
    },
    {
        "strTitle": "Credential Portability and the Open Learner Record",
        "strSummary": "Why learning achievements locked inside institutional silos undermine the value they claim to confer.",
        "strContent": "A credential that cannot travel is half a credential. We examine open standards — Open Badges, CLR, Verifiable Credentials — and what adoption actually requires from institutions.",
        "strThemeColor": "#3b82f6",
        "strCategory": "Discovery",
        "numReadTime": 12,
    },
    {
        "strTitle": "Source Attachment as a Social Norm",
        "strSummary": "Moving citation from academic obligation to everyday discourse habit.",
        "strContent": "Citation is not gatekeeping — it is a gift to the reader. This piece looks at how platform design can nudge users toward source attachment without making it feel like homework.",
        "strThemeColor": "#10b981",
        "strCategory": "Ethics",
        "numReadTime": 8,
    },
]


# ---------------------------------------------------------------------------
# Seeders
# ---------------------------------------------------------------------------
def seed_skills(db):
    """Reset and re-seed the capability carousel skills (incl. icon SVGs)."""
    print("Seeding Skills (with icons)...")
    db.query(SkillModel).delete()
    db.add_all([SkillModel(**row) for row in ARR_SKILLS])
    db.commit()


def seed_videos(db):
    """Reset and re-seed the Spotlight videos table, preserving the links."""
    print("Seeding Videos (links into table)...")
    db.query(VideoModel).delete()
    db.add_all([VideoModel(**row) for row in ARR_VIDEOS])
    db.commit()


def seed_projects(db):
    """Reset and re-seed the Projects directory."""
    print("Seeding Projects...")
    db.query(ProjectModel).delete()
    db.add_all([ProjectModel(**row) for row in ARR_PROJECTS])
    db.commit()


def seed_products(db):
    """Reset and re-seed the merch shop's product catalog."""
    print("Seeding Products...")
    db.query(ProductModel).delete()
    db.add_all([ProductModel(**row) for row in ARR_PRODUCTS])
    db.commit()


def seed_blogs(db):
    """Insert curated blogs if missing; reset Featured to all of them and
    pin the first 3 as the homepage "Recent Contributions".

    Non-destructive: never deletes existing blogs, comments or reactions.
    """
    print("Seeding Blogs (non-destructive) + resetting Featured...")
    featured_ids = []
    for row in ARR_BLOGS:
        existing = db.query(BlogModel).filter(BlogModel.strTitle == row["strTitle"]).first()
        if existing:
            # Backfill the category/read-time columns onto pre-existing rows -
            # these used to be guessed on the frontend from strThemeColor, so
            # older rows were seeded before the columns existed.
            existing.strCategory = row["strCategory"]
            existing.numReadTime = row["numReadTime"]
            db.commit()
            featured_ids.append(existing.id)
            continue
        blog = BlogModel(**row)
        db.add(blog)
        db.commit()
        db.refresh(blog)
        featured_ids.append(blog.id)

    # Point the homepage Featured list at exactly these contributions.
    db.query(FeaturedBlogModel).delete()
    db.add_all([FeaturedBlogModel(blog_id=bid) for bid in featured_ids])
    db.commit()

    # Pin the first 3 into the homepage "Recent Contributions" slots.
    db.query(RecentContributionModel).delete()
    db.add_all([
        RecentContributionModel(blog_id=bid, position=i + 1)
        for i, bid in enumerate(featured_ids[:3])
    ])
    db.commit()


def seed_data():
    db = SessionLocal()
    try:
        seed_skills(db)
        seed_videos(db)
        seed_projects(db)
        seed_products(db)
        seed_blogs(db)
    finally:
        db.close()
    print("Seeding complete!")


if __name__ == "__main__":
    seed_data()
