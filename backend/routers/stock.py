from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date
import yfinance as yf

from database import get_db
from models.stock import Holding, Watchlist, DailyPriceRecord, StockNote

router = APIRouter(prefix="/api/stock", tags=["stock"])


# ── 实时股价 ──────────────────────────────────────────
@router.get("/quote/{symbol}")
def get_quote(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        hist = ticker.history(period="1d", interval="1m")
        result = {
            "symbol": symbol,
            "current_price": info.last_price,
            "previous_close": info.previous_close,
        }
        if not hist.empty:
            high_idx = hist["High"].idxmax()
            low_idx = hist["Low"].idxmin()
            result["high_price"] = float(hist["High"].max())
            result["high_time"] = high_idx.strftime("%H:%M") if high_idx else None
            result["low_price"] = float(hist["Low"].min())
            result["low_time"] = low_idx.strftime("%H:%M") if low_idx else None
            result["close_price"] = float(hist["Close"].iloc[-1])
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 持仓 ──────────────────────────────────────────────
class HoldingCreate(BaseModel):
    symbol: str
    name: str
    buy_price: float
    quantity: float
    buy_date: date


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
