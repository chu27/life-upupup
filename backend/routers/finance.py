from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func
from pydantic import BaseModel
from typing import Optional
from datetime import date
import requests

from database import get_db
from models.finance import Transaction, Asset, Budget, FinancialGoal

router = APIRouter(prefix="/api/finance", tags=["finance"])


# ── 汇率 ──────────────────────────────────────────────
@router.get("/exchange-rates")
def get_exchange_rates():
    try:
        resp = requests.get("https://api.frankfurter.dev/v1/latest?from=JPY&to=USD,CNY", timeout=5)
        return resp.json()
    except Exception:
        return {"error": "汇率获取失败，请手动设置"}


# ── 收支 ──────────────────────────────────────────────
class TransactionCreate(BaseModel):
    type: str           # 收入 / 支出
    amount: float
    currency: str = "JPY"
    category: str
    date: date
    notes: Optional[str] = None


@router.get("/transactions")
def list_transactions(
    type: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Transaction)
    if type:
        q = q.filter(Transaction.type == type)
    if year:
        q = q.filter(extract("year", Transaction.date) == year)
    if month:
        q = q.filter(extract("month", Transaction.date) == month)
    return q.order_by(desc(Transaction.date)).all()


@router.post("/transactions")
def create_transaction(t: TransactionCreate, db: Session = Depends(get_db)):
    db_t = Transaction(**t.dict())
    db.add(db_t)
    db.commit()
    db.refresh(db_t)
    return db_t


@router.delete("/transactions/{t_id}")
def delete_transaction(t_id: int, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == t_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(t)
    db.commit()
    return {"ok": True}


# ── 资产 ──────────────────────────────────────────────
class AssetCreate(BaseModel):
    name: str
    asset_type: str
    amount: float
    currency: str = "JPY"
    investment_category: Optional[str] = None


@router.get("/assets")
def list_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


@router.post("/assets")
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    db_asset = Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.put("/assets/{asset_id}")
def update_asset(asset_id: int, asset: AssetCreate, db: Session = Depends(get_db)):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in asset.dict().items():
        setattr(db_asset, field, value)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(asset)
    db.commit()
    return {"ok": True}


# ── 预算 ──────────────────────────────────────────────
class BudgetCreate(BaseModel):
    year: int
    month: int
    category: str
    amount: float


@router.get("/budgets")
def list_budgets(year: int, month: int, db: Session = Depends(get_db)):
    return db.query(Budget).filter(Budget.year == year, Budget.month == month).all()


@router.post("/budgets")
def upsert_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    existing = db.query(Budget).filter(
        Budget.year == budget.year,
        Budget.month == budget.month,
        Budget.category == budget.category
    ).first()
    if existing:
        existing.amount = budget.amount
        db.commit()
        db.refresh(existing)
        return existing
    db_budget = Budget(**budget.dict())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget


# ── 财务目标 ──────────────────────────────────────────
class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    currency: str = "JPY"
    deadline: Optional[date] = None


@router.get("/goals")
def list_goals(db: Session = Depends(get_db)):
    return db.query(FinancialGoal).all()


@router.post("/goals")
def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    db_goal = FinancialGoal(**goal.dict())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.put("/goals/{goal_id}")
def update_goal(goal_id: int, goal: GoalCreate, db: Session = Depends(get_db)):
    db_goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in goal.dict().items():
        setattr(db_goal, field, value)
    db.commit()
    db.refresh(db_goal)
    return db_goal
