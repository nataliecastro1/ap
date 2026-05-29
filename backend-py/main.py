from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, extract

app = FastAPI(
    title="Anglepoint ROI Extractor API",
    description="Internal tool for extracting ROI metrics from ROAR/ELP documents",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(extract.router, prefix="/api/extract")


@app.on_event("startup")
async def startup_event() -> None:
    print("Anglepoint ROI Extractor API is running.")
    print("Docs available at http://localhost:8000/docs")


@app.get("/")
async def root() -> dict:
    return {"status": "ok", "message": "Anglepoint ROI Extractor API"}
