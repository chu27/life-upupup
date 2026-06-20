from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.grocery import GroceryPrice

router = APIRouter(prefix="/api/grocery", tags=["grocery"])


class GroceryCreate(BaseModel):
    name: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    price: float
    tax_type: str = "税后"
    discount: float = 0
    quantity: float = 1
    unit: str = "斤"
    origin: Optional[str] = None
    store: Optional[str] = None
    date: date
    notes: Optional[str] = None


@router.get("/prices")
def list_prices(name: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(GroceryPrice)
    if name:
        q = q.filter(GroceryPrice.name == name)
    if category:
        q = q.filter(GroceryPrice.category == category)
    return q.order_by(desc(GroceryPrice.date), desc(GroceryPrice.id)).all()


@router.post("/prices")
def create_price(data: GroceryCreate, db: Session = Depends(get_db)):
    item = GroceryPrice(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/prices/{price_id}")
def update_price(price_id: int, data: GroceryCreate, db: Session = Depends(get_db)):
    item = db.query(GroceryPrice).filter(GroceryPrice.id == price_id).first()
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.dict().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/prices/{price_id}")
def delete_price(price_id: int, db: Session = Depends(get_db)):
    item = db.query(GroceryPrice).filter(GroceryPrice.id == price_id).first()
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/names")
def list_names(db: Session = Depends(get_db)):
    """返回所有已记录过的菜名（去重）"""
    rows = db.query(GroceryPrice.name).distinct().order_by(GroceryPrice.name).all()
    return [r[0] for r in rows]
