from fastapi import FastAPI
from app.routers import auth

app = FastAPI(
    title="Budget App API",
    description="A personal budgeting application",
    version="1.0.0",
)

app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "Budget App API is running"}