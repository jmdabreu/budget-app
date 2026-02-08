from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post("/", response_model=schemas.BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_data: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    category = db.query(models.Category).filter(
        models.Category.id == budget_data.category_id,
        models.Category.user_id == current_user.id,
    ).first()

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    existing_budget = db.query(models.Budget).filter(
        models.Budget.category_id == budget_data.category_id,
        models.Budget.month == budget_data.month,
        models.Budget.user_id == current_user.id,
    ).first()

    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget already exists for this category and month",
        )

    new_budget = models.Budget(
        month=budget_data.month,
        limit_amount=budget_data.limit_amount,
        category_id=budget_data.category_id,
        user_id=current_user.id,
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget


@router.get("/", response_model=List[schemas.BudgetResponse])
def get_budgets(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Budget).filter(models.Budget.user_id == current_user.id)

    if month:
        query = query.filter(models.Budget.month == month)

    return query.all()


@router.get("/{budget_id}", response_model=schemas.BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id,
    ).first()

    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    return budget


@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(
    budget_id: int,
    budget_data: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id,
    ).first()

    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    budget.month = budget_data.month
    budget.limit_amount = budget_data.limit_amount
    budget.category_id = budget_data.category_id
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id,
    ).first()

    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return None