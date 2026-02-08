from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app import models
from app.dependencies import get_current_user
from app.cache import get_cache, set_cache

router = APIRouter(prefix="/summary", tags=["Summary"])


@router.get("/monthly/{month}")
def get_monthly_summary(
    month: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        year, mo = month.split("-")
        year = int(year)
        mo = int(mo)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be in format YYYY-MM (e.g. 2026-02)",
        )

    cache_key = f"summary:{current_user.id}:{month}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    categories = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.type == "expense",
    ).all()

    category_summaries = []

    for category in categories:
        spent = db.query(func.coalesce(func.sum(models.Transaction.amount), 0)).filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.category_id == category.id,
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == mo,
        ).scalar()

        spent = float(spent)

        budget = db.query(models.Budget).filter(
            models.Budget.user_id == current_user.id,
            models.Budget.category_id == category.id,
            models.Budget.month == month,
        ).first()

        limit_amount = budget.limit_amount if budget else None

        if limit_amount is None:
            status_label = "no_budget_set"
        elif spent >= limit_amount:
            status_label = "over_budget"
        elif spent >= limit_amount * 0.8:
            status_label = "near_limit"
        else:
            status_label = "under_budget"

        category_summaries.append({
            "category_id": category.id,
            "name": category.name,
            "spent": spent,
            "limit": limit_amount,
            "remaining": round(limit_amount - spent, 2) if limit_amount else None,
            "percentage": round((spent / limit_amount) * 100, 1) if limit_amount else None,
            "status": status_label,
        })

    total_spent = sum(c["spent"] for c in category_summaries)
    total_limit = sum(c["limit"] for c in category_summaries if c["limit"] is not None)

    income = db.query(func.coalesce(func.sum(models.Transaction.amount), 0)).join(
        models.Category
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Category.type == "income",
        extract("year", models.Transaction.date) == year,
        extract("month", models.Transaction.date) == mo,
    ).scalar()

    income = float(income)

    result = {
        "month": month,
        "total_income": income,
        "total_spent": total_spent,
        "total_budget_limit": total_limit,
        "net": round(income - total_spent, 2),
        "categories": category_summaries,
    }

    set_cache(cache_key, result)

    return result


@router.get("/alerts/{month}")
def get_budget_alerts(
    month: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    summary = get_monthly_summary(month, db, current_user)

    alerts = []

    for category in summary["categories"]:
        if category["status"] == "over_budget":
            alerts.append({
                "category": category["name"],
                "severity": "high",
                "message": f"Over budget by ${abs(category['remaining']):.2f}",
                "spent": category["spent"],
                "limit": category["limit"],
            })
        elif category["status"] == "near_limit":
            alerts.append({
                "category": category["name"],
                "severity": "warning",
                "message": f"At {category['percentage']}% of budget — ${category['remaining']:.2f} remaining",
                "spent": category["spent"],
                "limit": category["limit"],
            })

    if summary["net"] < 0:
        alerts.append({
            "category": "Overall",
            "severity": "high",
            "message": f"Spending exceeds income by ${abs(summary['net']):.2f}",
            "spent": summary["total_spent"],
            "limit": summary["total_income"],
        })

    return {
        "month": month,
        "alert_count": len(alerts),
        "alerts": alerts,
    }