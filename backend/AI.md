# Backend — System Specification

**Authoritative reference for all backend code in this repository.**
This file governs both human contributors and AI agents. Every rule here is enforced — not aspirational.

---

## 1. Stack

| Concern | Choice | Note |
|---|---|---|
| Framework | FastAPI | Async-capable, auto-docs via Swagger/ReDoc |
| Database (production) | PostgreSQL (Neon) | Serverless, branching-aware |
| Database (local) | SQLite | File-based, zero-config |
| ORM | SQLAlchemy 2.x | Declarative models only — no Django ORM patterns |
| Validation | Pydantic v2 | Request/response schemas |
| Migrations | Alembic | Auto-generated, reviewed before commit |
| Auth | JWT (python-jose + passlib[bcrypt]) | Short-lived access tokens |
| Linting | flake8 + mypy | Zero errors policy |
| Testing | pytest | In-memory SQLite, auto-rollback fixtures |

**Dependency rule:** No new packages without explicit approval. No Django ecosystem packages — `Django`, `djangorestframework`, `django-cors-headers`, `django-environ`, `django-filter`, `whitenoise` are banned.

---

## 2. Folder Structure

```
backend/
├── .env                  ← Secrets (git-ignored, never committed)
├── .env.example          ← Safe template: every variable documented
├── requirements.txt
├── main.py               ← FastAPI instance, CORS, middleware
├── dependencies.py       ← Shared dependencies (get_db, get_current_user)
├── seed_db.py            ← Database seeding script
│
├── routers/              ← Route handlers only — no business logic
│   ├── user.py
│   ├── portfolio.py
│   ├── product.py
│   └── order.py
│
├── services/             ← Business logic, called by routers
│   ├── user_service.py
│   └── product_service.py
│
├── models/               ← SQLAlchemy declarative models
│   ├── user_model.py
│   ├── portfolio_model.py
│   └── product_model.py
│
├── schemas/              ← Pydantic request/response models
│   ├── user_schema.py
│   └── product_schema.py
│
├── migrations/           ← Alembic migration scripts
│   └── versions/
│
└── tests/                ← Mirrors routers/ and services/
    ├── test_user.py
    └── test_product.py
```

---

## 3. Naming Conventions

### 3.1 Files

| File Pattern | Purpose |
|---|---|
| `routers/<resource>.py` | Route handlers for a resource |
| `services/<resource>_service.py` | Business logic for a resource |
| `models/<resource>_model.py` | SQLAlchemy model |
| `schemas/<resource>_schema.py` | Pydantic schemas |

### 3.2 Variables

| Type | Pattern | Example |
|---|---|---|
| String | `str<Name>` | `strProductName` |
| Number | `num<Name>` | `numOrderCount` |
| Boolean | `bool<Name>` | `boolIsActive` |
| List | `arr<Name>` | `arrProductList` |
| Dictionary | `dict<Name>` | `dictUserData` |
| Object | `obj<Name>` | `objUserProfile` |

---

## 4. Architecture Rules

### 4.1 Thin Route Handlers

Route handlers parse input, call a service function, and return the result. No business logic, no database queries, no conditionals beyond auth checks.

```python
@router.get("/{num_product_id}", response_model=ProductResponse)
def get_product(num_product_id: int, db: Session = Depends(get_db)):
    return product_service.get_product_by_id(db, num_product_id)
```

### 4.2 API Conventions

- All endpoints prefixed with `/api/`.
- Standard RESTful verbs: `GET` (read), `POST` (create), `PUT` (update), `DELETE` (remove).
- All responses are JSON.

### 4.3 Session Management

Database sessions are injected via FastAPI dependency. Never instantiate a session manually.

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 4.4 Error Responses

Standard envelope for all 4xx/5xx:

```json
{"detail": "Human-readable error message."}
```

Paginated lists:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "size": 10
}
```

---

## 5. Security

### 5.1 Authentication

- JWT tokens issued with short expiry (`ACCESS_TOKEN_EXPIRE_MINUTES` from `.env`).
- All protected endpoints use `get_current_user` dependency — no manual auth checks.
- Never log token values. Never return tokens in error responses.

### 5.2 Passwords

- Hashed with `bcrypt` via `passlib`. Never stored or logged in plaintext.

### 5.3 Input Validation

- All request bodies validated by Pydantic schemas before reaching handlers.
- No raw user input interpolated into SQL. Use SQLAlchemy ORM exclusively.

### 5.4 CORS

Explicit origin allowlist only. `allow_origins=["*"]` is banned in all environments.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 5.5 Secrets

- All secrets (`SECRET_KEY`, `DATABASE_URL`, credentials) live in `.env` only.
- `.env` is in `.gitignore` — must never be committed.
- `.env.example` documents every variable with sensitivity markers.
- No secret or credential appears in any committed file.

### 5.6 Dependency Auditing

- `pip-audit` on every push. Block merge on high or critical CVEs.

---

## 6. Code Quality

### 6.1 Style

- PEP 8 enforced via `flake8`.
- Line length: 100 characters max.
- Type hints on all function signatures, router endpoints, and schema fields.

### 6.2 Documentation

All public endpoints and service functions must have Google-style docstrings:

```python
def get_product_by_id(db: Session, num_product_id: int) -> ProductResponse:
    """Retrieve a single product by primary key.

    Args:
        db: Active SQLAlchemy session.
        num_product_id: Primary key of the product.

    Returns:
        ProductResponse schema from the database record.

    Raises:
        HTTPException: 404 if product not found.
    """
```

### 6.3 Prohibited Patterns

- No `print()` — use `logging` module.
- No commented-out code. Git history is the archive.
- No magic numbers/strings — use named constants.
- No Django ORM patterns (`User.objects.filter()`, `instance.save()`).
- No duplicate API endpoints.

---

## 7. Database & Migrations

### 7.1 Alembic Rules

- Every SQLAlchemy model change requires a corresponding migration script.
- Auto-generate: `alembic revision --autogenerate -m "description"`.
- Review auto-generated scripts before committing.
- Never run raw DDL directly on production databases.

### 7.2 Seeding

`seed_db.py` handles development data. It resets Skills, Videos, and Projects tables. Blogs are non-destructive (insert-if-missing only).

---

## 8. Testing

### 8.1 Test Pyramid

| Layer | Volume | Scope |
|---|---|---|
| Unit | Many | Service functions, utility logic (≥ 80% coverage) |
| Integration | Some | Route handlers with in-memory DB |
| E2E | Few | Critical API flows (auth, CRUD) |

### 8.2 Placement

Test files mirror source hierarchy in `tests/`.

### 8.3 Mocking

- Database: pytest fixture with in-memory SQLite, auto-rollback.
- External HTTP: `responses` or `unittest.mock`. No network calls in tests.

---

## 9. Agent Rules (AI-Assisted Development)

1. **Read this file and `frontend/AI.md` before any refactoring or structural change.**
2. **Show a file-level plan before creating new routers, models, or services.** Get confirmation.
3. **Never install packages without confirmation.**
4. **Never delete files without confirmation.**
5. **Keep route handlers thin.** If you see business logic in a router, extract it.
6. **Flag security issues on sight:** raw SQL interpolation, plaintext passwords, hardcoded secrets, `allow_origins=["*"]`, `print()` with sensitive data.
7. **Flag Django residue on sight:** any import from `django.*` or `rest_framework.*`, any `User.objects.filter()` pattern, any `instance.save()` call.
8. **Run tests** after any logic change: `pytest tests/`.
9. **Run lint** after any code change: `flake8 backend/ && mypy backend/`.

---

## 10. Commit Messages

Follow Conventional Commits:

```
feat(orders): add order creation endpoint
fix(auth): correct token expiry calculation
refactor(user): extract profile logic to service layer
chore(deps): update sqlalchemy to 2.0.x
```

---

## 11. Definition of Done

A task is complete when:

- [ ] Route handler delegates entirely to a service — no inline logic
- [ ] All new endpoints and services have Google-style docstrings
- [ ] All new Pydantic schemas live in `schemas/`
- [ ] Model changes have a corresponding Alembic migration
- [ ] No `print()` in production paths
- [ ] No raw SQL without documented justification
- [ ] No magic numbers or strings
- [ ] No commented-out code
- [ ] No banned Django packages in `requirements.txt`
- [ ] No secrets in any committed file
- [ ] All tests pass: `pytest tests/`
- [ ] Lint clean: `flake8` + `mypy` zero errors
