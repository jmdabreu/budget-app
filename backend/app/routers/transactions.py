from app.cache import delete_cache_pattern
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    category = db.query(models.Category).filter(
        models.Category.id == transaction_data.category_id,
        models.Category.user_id == current_user.id,
    ).first()

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    new_transaction = models.Transaction(
        amount=transaction_data.amount,
        description=transaction_data.description,
        date=transaction_data.date,
        category_id=transaction_data.category_id,
        user_id=current_user.id,
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    delete_cache_pattern(f"summary:{current_user.id}:*")
    return new_transaction
    


@router.get("/", response_model=List[schemas.TransactionResponse])
def get_transactions(
    category_id: Optional[int] = Query(None),
    month: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)

    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)

    if month:
        from sqlalchemy import extract
        year, mo = month.split("-")
        query = query.filter(
            extract("year", models.Transaction.date) == int(year),
            extract("month", models.Transaction.date) == int(mo),
        )

    return query.order_by(models.Transaction.date.desc()).all()


@router.get("/{transaction_id}", response_model=schemas.TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id,
    ).first()

    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return transaction


@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_data: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id,
    ).first()

    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if transaction_data.category_id is not None:
        category = db.query(models.Category).filter(
            models.Category.id == transaction_data.category_id,
            models.Category.user_id == current_user.id,
        ).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_fields = transaction_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    delete_cache_pattern(f"summary:{current_user.id}:*")
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id,
    ).first()

    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    delete_cache_pattern(f"summary:{current_user.id}:*")
    return None