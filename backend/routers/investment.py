from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta

from database import get_db
from models.investment import InvestmentItem, InvestmentLog
from models.finance import Asset

router = APIRouter(prefix="/api/investment", tags=["investment"])

# 投资分类 → 关联现金账户名称（加钱时该现金账户减少，提现时增加）
CATEGORY_CASH_ACCOUNT = {
    "A股": "股票现金",
    "基金": "支付宝活期",
    "美股": "SBI美元账户",
    "日股": "sbi日元账户",
}


def _sync_cash_account(db: Session, item_id: int, cap_delta: float):
    """资金变动联动现金账户：现金账户变化 = -（资金变动差额）。
    加钱(+)使现金减少，提现(-)使现金增加。"""
    if not cap_delta:
        return
    item = db.query(InvestmentItem).filter(InvestmentItem.id == item_id).first()
    if not item:
        return
    acc_name = CATEGORY_CASH_ACCOUNT.get(item.category)
    if not acc_name:
        return
    acc = db.query(Asset).filter(Asset.name == acc_name).first()
    if not acc:
        return
    acc.amount = round((acc.amount or 0) - cap_delta, 2)


class ItemCreate(BaseModel):
    name: str
    category: str = "基金"
    currency: str = "JPY"
    notes: Optional[str] = None


class LogCreate(BaseModel):
    item_id: int
    date: date
    amount: float
    capital_change: float = 0


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
    # 查所有同 item+date 记录，删除多余，只保留并更新一条
    all_existing = db.query(InvestmentLog).filter(
        InvestmentLog.item_id == data.item_id,
        InvestmentLog.date == data.date
    ).order_by(InvestmentLog.id).all()
    if all_existing:
        for rec in all_existing[:-1]:  # 删除较旧的，保留最后一条
            db.delete(rec)
        existing = all_existing[-1]
        old_cap = existing.capital_change or 0.0
        existing.amount = data.amount
        existing.capital_change = data.capital_change
        # 只按差额联动现金账户（避免编辑时重复扣款）
        _sync_cash_account(db, data.item_id, (data.capital_change or 0.0) - old_cap)
        db.commit()
        db.refresh(existing)
        return existing
    log = InvestmentLog(**data.dict())
    db.add(log)
    _sync_cash_account(db, data.item_id, data.capital_change or 0.0)
    db.commit()
    db.refresh(log)
    return log


@router.get("/category-pnl")
def get_category_pnl(category: str, db: Session = Depends(get_db)):
    """返回某分类下所有投资项按日期聚合的总金额，计算每日盈亏。
    新增项第一条记录自动视为资金投入（不计入盈亏），避免初始金额被误算成收益。
    """
    from collections import defaultdict

    items = db.query(InvestmentItem).filter(InvestmentItem.category == category).all()
    if not items:
        return []
    item_ids = [i.id for i in items]
    logs = db.query(InvestmentLog).filter(
        InvestmentLog.item_id.in_(item_ids)
    ).order_by(InvestmentLog.date).all()

    if not logs:
        return []

    # 每个 item 的第一条记录日期
    item_first_date: dict = {}
    for log in logs:
        if log.item_id not in item_first_date or log.date < item_first_date[log.item_id]:
            item_first_date[log.item_id] = log.date

    # 按 (item_id, date) 去重，保留 id 最大的一条
    best: dict = {}
    for log in logs:
        key = (log.item_id, log.date)
        if key not in best or log.id > best[key].id:
            best[key] = log

    # 按日期建索引：date -> [log, ...]
    logs_by_date: dict = defaultdict(list)
    for log in best.values():
        logs_by_date[log.date].append(log)

    all_dates = sorted(logs_by_date.keys())

    result = []
    prev_total = None
    last_amount: dict = {}   # item_id -> 最近已知金额（用于carry-forward）

    for d in all_dates:
        day_capital = 0.0
        for log in logs_by_date[d]:
            last_amount[log.item_id] = log.amount
            cap = log.capital_change or 0.0
            # 第一条记录：初始金额视为资金投入，不算盈亏
            if d == item_first_date[log.item_id] and cap == 0.0:
                cap += log.amount
            day_capital += cap

        total = sum(last_amount.values())
        pnl = round(total - prev_total - day_capital, 2) if prev_total is not None else None
        result.append({
            "date": str(d),
            "total": round(total, 2),
            "capital_change": round(day_capital, 2),
            "pnl": pnl,
        })
        prev_total = total

    return result


@router.delete("/logs/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(InvestmentLog).filter(InvestmentLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Not found")
    # 撤销该条资金变动对现金账户的影响
    _sync_cash_account(db, log.item_id, -(log.capital_change or 0.0))
    db.delete(log)
    db.commit()
    return {"ok": True}


# ── 各分类最新余额（供资产总览同步） ────────────────
@router.get("/daily-totals")
def get_daily_totals(db: Session = Depends(get_db)):
    """
    返回各分类按货币分组的最新余额之和。
    每个投资条目取其最近一条记录（不限今日），避免当天未填时显示0。
    结构：{ "基金": { "CNY": 100000, "JPY": 50000 }, "美股": { "USD": 12345 }, ... }
    """
    CATEGORIES = ["美股", "日股", "A股", "基金"]
    result: dict = {cat: {} for cat in CATEGORIES}

    for cat in CATEGORIES:
        items = db.query(InvestmentItem).filter(InvestmentItem.category == cat).all()
        for item in items:
            # 取该条目最新一条记录
            latest = db.query(InvestmentLog).filter(
                InvestmentLog.item_id == item.id
            ).order_by(desc(InvestmentLog.date)).first()
            if latest:
                ccy = item.currency
                result[cat][ccy] = result[cat].get(ccy, 0) + latest.amount

    # 四舍五入
    for cat in result:
        result[cat] = {ccy: round(v, 2) for ccy, v in result[cat].items()}
    return result


# ── 自动补今日记录 ──────────────────────────────────────
@router.post("/auto-fill-today")
def auto_fill_today(db: Session = Depends(get_db)):
    """
    对所有今日尚无记录的投资条目，取该条目最近一条历史记录的金额，
    自动写入今日记录（capital_change=0），实现「昨日价格延续」。
    """
    today = date.today()
    items = db.query(InvestmentItem).all()
    filled = []
    for item in items:
        has_today = db.query(InvestmentLog).filter(
            InvestmentLog.item_id == item.id,
            InvestmentLog.date == today
        ).first()
        if has_today:
            continue
        latest = db.query(InvestmentLog).filter(
            InvestmentLog.item_id == item.id,
            InvestmentLog.date < today
        ).order_by(desc(InvestmentLog.date)).first()
        if latest:
            log = InvestmentLog(item_id=item.id, date=today, amount=latest.amount, capital_change=0.0)
            db.add(log)
            filled.append(item.name)
    db.commit()
    return {"filled": filled, "count": len(filled)}


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
        pnl = None
        if today_log and yesterday_log:
            pnl = round(today_log.amount - yesterday_log.amount - (today_log.capital_change or 0), 2)
        result.append({
            "id": item.id,
            "name": item.name,
            "currency": item.currency,
            "notes": item.notes,
            "today": today_log.amount if today_log else None,
            "yesterday": yesterday_log.amount if yesterday_log else None,
            "capital_change": today_log.capital_change if today_log else None,
            "pnl": pnl,
        })
    return result
