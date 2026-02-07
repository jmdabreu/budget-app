from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


class CategoryBase(BaseModel):
    name: str
    type: str


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    amount: float
    description: Optional[str] = None
    date: date
    category_id: int


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[date] = None
    category_id: Optional[int] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class BudgetBase(BaseModel):
    month: str
    limit_amount: float
    category_id: int


class BudgetCreate(BudgetBase):
    pass


class BudgetResponse(BudgetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True