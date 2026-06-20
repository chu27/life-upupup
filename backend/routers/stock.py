from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta, datetime
import yfinance as yf
from zoneinfo import ZoneInfo
from collections import defaultdict

JST = ZoneInfo("Asia/Tokyo")

from database import get_db
from models.stock import Holding, Watchlist, DailyPriceRecord, StockNote

router = APIRouter(prefix="/api/stock", tags=["stock"])


def resolve_yf_symbol(symbol: str) -> str:
    """根据股票代码格式自动加上交易所后缀"""
    s = symbol.strip().upper()
    # 已有后缀则直接用
    if '.' in s:
        return s
    # 日股：4位纯数字
    if s.isdigit() and len(s) == 4:
        return s + '.T'
    # A股：6位纯数字
    if s.isdigit() and len(s) == 6:
        if s.startswith(('6', '9')):
            return s + '.SS'   # 上交所
        else:
            return s + '.SZ'   # 深交所
    # 其余视为美股
    return s


def to_jst_str(ts) -> Optional[str]:
    if ts is None:
        return None
    try:
        return ts.astimezone(JST).strftime("%H:%M")
    except Exception:
        return ts.strftime("%H:%M")


# ── 实时/历史 股价 ──────────────────────────────────────
@router.get("/quote/{symbol}")
def get_quote(symbol: str, target_date: Optional[str] = None):
    try:
        yf_symbol = resolve_yf_symbol(symbol)
        ticker = yf.Ticker(yf_symbol)

        # ── 历史某天 ──
        if target_date:
            d = datetime.strptime(target_date, "%Y-%m-%d").date()
            next_d = d + timedelta(days=1)
            # 先尝试分钟级（只支持近7天）
            hist = ticker.history(start=str(d), end=str(next_d), interval="1m")
            if not hist.empty:
                high_idx = hist["High"].idxmax()
                low_idx  = hist["Low"].idxmin()
                return {
                    "symbol": symbol,
                    "current_price": float(hist["Close"].iloc[-1]),
                    "previous_close": None,
                    "high_price": float(hist["High"].max()),
                    "high_time": to_jst_str(high_idx),
                    "low_price": float(hist["Low"].min()),
                    "low_time": to_jst_str(low_idx),
                    "close_price": float(hist["Close"].iloc[-1]),
                    "is_delayed": True,
                }
            # 日线fallback
            hist_d = ticker.history(start=str(d), end=str(next_d), interval="1d")
            if not hist_d.empty:
                row = hist_d.iloc[0]
                return {
                    "symbol": symbol,
                    "current_price": float(row["Close"]),
                    "previous_close": None,
                    "high_price": float(row["High"]),
                    "high_time": None,
                    "low_price": float(row["Low"]),
                    "low_time": None,
                    "close_price": float(row["Close"]),
                    "is_delayed": True,
                }
            raise HTTPException(status_code=404, detail="该日期无数据（可能为休市日）")

        # ── 今日实时 ──
        info = ticker.fast_info
        hist = ticker.history(period="1d", interval="1m")

        if hist.empty:
            hist_daily = ticker.history(period="5d", interval="1d")
            if not hist_daily.empty:
                last_row = hist_daily.iloc[-1]
                return {
                    "symbol": symbol,
                    "current_price": float(last_row["Close"]),
                    "previous_close": float(hist_daily.iloc[-2]["Close"]) if len(hist_daily) >= 2 else None,
                    "high_price": float(last_row["High"]),
                    "high_time": None,
                    "low_price": float(last_row["Low"]),
                    "low_time": None,
                    "close_price": float(last_row["Close"]),
                    "is_delayed": True,
                }
            raise HTTPException(status_code=404, detail="无法获取该股票数据")

        last_price = info.last_price or 0
        hist_high = float(hist["High"].max())
        hist_low  = float(hist["Low"].min())

        # 实时价可能比K线最新数据更新，确保高低点包含当前价
        actual_high = max(hist_high, last_price)
        actual_low  = min(hist_low,  last_price)

        high_idx = hist["High"].idxmax()
        low_idx  = hist["Low"].idxmin()
        return {
            "symbol": symbol,
            "current_price": last_price,
            "previous_close": info.previous_close,
            "high_price": actual_high,
            "high_time": to_jst_str(high_idx) if actual_high == hist_high else None,
            "low_price": actual_low,
            "low_time": to_jst_str(low_idx) if actual_low == hist_low else None,
            "close_price": float(hist["Close"].iloc[-1]),
            "is_delayed": False,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 高低点时间分布 ─────────────────────────────────────
@router.get("/highlow-distribution/{symbol}")
def get_highlow_distribution(symbol: str, days: int = 30):
    """返回最近 N 天每天的最高/最低点出现时间（JST），用于绘制分布图"""
    try:
        yf_symbol = resolve_yf_symbol(symbol)
        ticker = yf.Ticker(yf_symbol)

        # Yahoo Finance 30m 数据硬性上限约60天
        # 策略：近60天用30m，更早的补60m，合并后统一处理
        import pandas as pd
        end_date = datetime.now(JST).date()
        start_date = end_date - timedelta(days=days)
        LIMIT_30M = 58  # 30m 能拿到的最大天数

        hist_30m = ticker.history(period=f"{LIMIT_30M}d", interval="30m")

        if days <= LIMIT_30M or start_date >= (end_date - timedelta(days=LIMIT_30M)):
            hist = hist_30m
        else:
            # 60m 补齐更早的部分（60m 支持 730 天）
            hist_60m = ticker.history(
                start=str(start_date),
                end=str(end_date - timedelta(days=LIMIT_30M)),
                interval="60m"
            )
            if not hist_60m.empty and not hist_30m.empty:
                hist = pd.concat([hist_60m, hist_30m]).sort_index().drop_duplicates()
            elif not hist_30m.empty:
                hist = hist_30m
            else:
                hist = hist_60m
        if hist.empty:
            return []

        # 转 JST
        hist.index = hist.index.tz_convert(JST)

        daily: list = []
        for day, grp in hist.groupby(hist.index.date):
            if grp.empty:
                continue
            hi_idx = grp["High"].idxmax()
            lo_idx = grp["Low"].idxmin()
            daily.append({
                "date": str(day),
                "high_price": round(float(grp["High"].max()), 4),
                "high_time": hi_idx.strftime("%H:%M"),
                "low_price":  round(float(grp["Low"].min()),  4),
                "low_time":  lo_idx.strftime("%H:%M"),
            })
        return daily
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 持仓 ──────────────────────────────────────────────
class HoldingCreate(BaseModel):
    symbol: str
    name: str
    buy_price: float = 0
    quantity: float = 0
    buy_date: date
    status: str = '已买'
    notes: Optional[str] = None


@router.get("/holdings")
def list_holdings(db: Session = Depends(get_db)):
    return db.query(Holding).filter(Holding.sell_date == None).all()


@router.post("/holdings")
def create_holding(h: HoldingCreate, db: Session = Depends(get_db)):
    db_h = Holding(**h.dict())
    db.add(db_h)
    db.commit()
    db.refresh(db_h)
    return db_h


@router.put("/holdings/{h_id}")
def update_holding(h_id: int, data: HoldingCreate, db: Session = Depends(get_db)):
    h = db.query(Holding).filter(Holding.id == h_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.dict().items():
        setattr(h, k, v)
    db.commit()
    db.refresh(h)
    return h


@router.delete("/holdings/{h_id}")
def delete_holding(h_id: int, db: Session = Depends(get_db)):
    h = db.query(Holding).filter(Holding.id == h_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(h)
    db.commit()
    return {"ok": True}


@router.put("/holdings/{h_id}/sell")
def sell_holding(h_id: int, sell_price: float, sell_date: date, db: Session = Depends(get_db)):
    h = db.query(Holding).filter(Holding.id == h_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    h.sell_price = sell_price
    h.sell_date = sell_date
    db.commit()
    return h


# ── 观察池 ────────────────────────────────────────────
class WatchlistCreate(BaseModel):
    symbol: str
    name: str
    notes: Optional[str] = None


@router.get("/watchlist")
def list_watchlist(db: Session = Depends(get_db)):
    return db.query(Watchlist).all()


@router.post("/watchlist")
def add_to_watchlist(item: WatchlistCreate, db: Session = Depends(get_db)):
    existing = db.query(Watchlist).filter(Watchlist.symbol == item.symbol).first()
    if existing:
        raise HTTPException(status_code=400, detail="已在观察池中")
    db_item = Watchlist(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/watchlist/{item_id}")
def update_watchlist(item_id: int, notes: str, db: Session = Depends(get_db)):
    item = db.query(Watchlist).filter(Watchlist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item.notes = notes
    db.commit()
    return item


@router.delete("/watchlist/{item_id}")
def remove_from_watchlist(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Watchlist).filter(Watchlist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


# ── 每日价格记录 ──────────────────────────────────────
@router.get("/price-records/{symbol}")
def get_price_records(symbol: str, db: Session = Depends(get_db)):
    return db.query(DailyPriceRecord).filter(
        DailyPriceRecord.symbol == symbol
    ).order_by(desc(DailyPriceRecord.date)).limit(30).all()


# ── 学习笔记 ──────────────────────────────────────────
class NoteCreate(BaseModel):
    title: str
    content: str
    tags: Optional[str] = None


@router.get("/notes")
def list_notes(db: Session = Depends(get_db)):
    return db.query(StockNote).order_by(desc(StockNote.updated_at)).all()


@router.post("/notes")
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    db_note = StockNote(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@router.put("/notes/{note_id}")
def update_note(note_id: int, note: NoteCreate, db: Session = Depends(get_db)):
    db_note = db.query(StockNote).filter(StockNote.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in note.dict().items():
        setattr(db_note, field, value)
    db.commit()
    db.refresh(db_note)
    return db_note


# ── AI 占位接口 ────────────────────────────────────────
@router.post("/notes/{note_id}/ai-organize")
def ai_organize_note(note_id: int):
    return {"message": "AI 功能待实装", "available": False}


@router.post("/watchlist/{item_id}/ai-analysis")
def ai_analysis(item_id: int):
    return {"message": "AI 功能待实装", "available": False}
