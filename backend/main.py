import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import verisphere, portfolio, project, merch, auth, activity, engagement, analysis_threads, communities, posts, account, reports
from database import engine
from models import blog_models, portfolio_models, user_models, engagement_models, merch_models
from core.config import settings

blog_models.Base.metadata.create_all(bind=engine)
portfolio_models.Base.metadata.create_all(bind=engine)
user_models.Base.metadata.create_all(bind=engine)
engagement_models.Base.metadata.create_all(bind=engine)
merch_models.Base.metadata.create_all(bind=engine)

# Print the AI mode this process booted with. Because pydantic Settings reads
# env vars ONCE at startup, this line is the source of truth for whether THIS
# running process will call real Gemini or return mock data - editing .env
# after boot changes nothing until the process is restarted.
_log = logging.getLogger("uvicorn.error")
_log.info(
    "[STARTUP] AI audit mode: %s%s",
    "MOCK (USE_MOCK_LLM=True)" if settings.USE_MOCK_LLM else "REAL GEMINI (USE_MOCK_LLM=False)",
    "" if settings.USE_MOCK_LLM else (" — API key present" if settings.GEMINI_API_KEY else " — WARNING: GEMINI_API_KEY is EMPTY"),
)

app = FastAPI(title="Synapse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://192.168.1.35:5173", "https://synapseislive.com", "https://www.synapseislive.com", "https://synapseliveexchange.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(verisphere.router)
app.include_router(portfolio.router)
app.include_router(project.router)
app.include_router(merch.router)
app.include_router(activity.router)
app.include_router(engagement.router)
app.include_router(analysis_threads.router)
app.include_router(communities.router)
app.include_router(posts.router)
app.include_router(account.router)
app.include_router(reports.router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Flatten pydantic's structured errors into one readable message so
    # apiClient's `error.response.data.detail` stays a plain string.
    first = exc.errors()[0]
    message = first["msg"].removeprefix("Value error, ")
    return JSONResponse(status_code=422, content={"detail": message})

@app.get("/")
def root():
    return {"message": "Welcome to Synapse-LE FastAPI Backend!"}
