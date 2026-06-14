from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta

from database import get_db
from models.investment import InvestmentItem, InvestmentLog

router = APIRouter(prefix="/api/investment", tags=["investment"])


class ItemCreate(BaseModel):
    name: str
    category: str = "基金"
    currency: str = "JPY"
    notes: Optional[str] = None


class LogCreate(BaseModel):
    item_id: int
    date: date
    amount: float


# ── 投资条目 ──────────────────────────────────────────
@router.get("/items")
def list_items(category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(InvestmentItem)
    if category:
        q = q.filter(InvestmentItem.category == category)
    return q.order_by(InvestmentItem.id).all()


@router.post("/items")
def create_item(data: ItemCreate, db: Session = Depends(get_db)):
    item = InvestmentItem(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}")
def update_item(item_id: int, data: ItemCreate, db: Session = Depends(get_db)):
    item = db.query(InvestmentItem).filter(InvestmentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.dict().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InvestmentItem).filter(InvestmentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


# ── 每日记录 ──────────────────────────────────────────
@router.get("/logs")
def list_logs(item_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(InvestmentLog)
    if item_id:
        q = q.filter(InvestmentLog.item_id == item_id)
    return q.order_by(desc(InvestmentLog.date)).all()


@router.post("/logs")
def upsert_log(data: LogCreate, db: Session = Depends(get_db)):
    existing = db.query(InvestmentLog).filter(
        InvestmentLog.item_id == data.item_id,
        InvestmentLog.date == data.date
    ).first()
    if existing:
        existing.amount = data.amount
        db.commit()
        db.refresh(existing)
        return existing
    log = InvestmentLog(**data.dict())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/category-pnl")
def get_category_pnl(category: str, db: Session = Depends(get_db)):
    """返回某分类下所有投资项按日期聚合的总金额，计算每日盈亏"""
    items = db.query(InvestmentItem).filter(InvestmentItem.category == category).all()
    if not items:
        return []
    item_ids = [i.id for i in items]
    logs = db.query(InvestmentLog).filter(
        InvestmentLog.item_id.in_(item_ids)
    ).order_by(InvestmentLog.date).all()

    # 按日期聚合总金额
    daily: dict = {}
    for log in logs:
        d = str(log.date)
        daily[d] = daily.get(d, 0) + log.amount

    sorted_dates = sorted(daily.keys())
    result = []
    for i, d in enumerate(sorted_dates):
        prev = daily[sorted_dates[i - 1]] if i > 0 else None
        result.append({
            "date": d,
            "total": daily[d],
            "pnl": round(daily[d] - prev, 2) if prev is not None else None,
        })
    return result


@router.delete("/logs/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(InvestmentLog).filter(InvestmentLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(log)
    db.commit()
    return {"ok": True}


# ── 盈亏汇总（今日 vs 昨日） ──────────────────────────
@router.get("/summary")
def get_summary(target_date: Optional[date] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    today = target_date or date.today()
    yesterday = today - timedelta(days=1)

    q = db.query(InvestmentItem)
    if category:
        q = q.filter(InvestmentItem.category == category)
    items = q.order_by(InvestmentItem.id).all()
    result = []
    for item in items:
        today_log = db.query(InvestmentLog).filter(
            InvestmentLog.item_id == item.id,
            InvestmentLog.date == today
        ).first()
        yesterday_log = db.query(InvestmentLog).filter(
            InvestmentLog.item_id == item.id,
            InvestmentLog.date == yesterday
        ).first()
        result.append({
            "id": item.id,
            "name": item.name,
            "currency": item.currency,
            "notes": item.notes,
            "today": today_log.amount if today_log else None,
            "yesterday": yesterday_log.amount if yesterday_log else None,
            "pnl": (today_log.amount - yesterday_log.amount) if (today_log and yesterday_log) else None,
        })
    return result
