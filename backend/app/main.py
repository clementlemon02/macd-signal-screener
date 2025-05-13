from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import stocks, crypto, auth

app = FastAPI(
    title="MACD Signal Screener",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://macdsignal.com"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stocks.router, prefix="/api/v1")
app.include_router(crypto.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to MACD Signal Screener API"}
