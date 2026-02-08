from fastapi import FastAPI
from app.routers import auth, categories, transactions, budgets, summary

app = FastAPI(
    title="Budget App API",
    description="A personal budgeting application",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(summary.router)


@app.get("/")
def root():
    return {"message": "Budget App API is running"}