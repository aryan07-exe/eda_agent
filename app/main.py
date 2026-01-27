from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from api.analyze import router
import logging

# Load environment variables early
load_dotenv()

# Configure logging to see errors in terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Analytix Intelligence Engine",
    description="Automated exploratory data analysis with AI-powered visualization suggestions.",
    version="2.1.0"
)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP Error {exc.status_code}: {exc.detail}")
    # Catch the specific "error parsing the body" case
    if exc.status_code == 400 and "parsing the body" in str(exc.detail):
        return JSONResponse(
            status_code=400,
            content={"detail": "Server failed to parse the file upload. This usually happens if the file is corrupted or too large. Please try again."}
        )
    return JSONResponse(status_code=exc.status_code, content={"detail": str(exc.detail)})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An internal server error occurred: {str(exc)}"}
    )

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {"status": "ready", "engine": "AutoEDA v2.0"}
