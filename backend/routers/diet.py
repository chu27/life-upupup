from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.diet import MealRecord, WaterRecord

router = APIRouter(prefix="/api/diet", tags=["diet"])


class MealCreate(BaseModel):
    date: date
    meal_type: str          # 早餐 / 午餐 / 晚餐 / 加餐
    description: str
    recipe_notes: Optional[str] = None
    ingredient_weight: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None


@router.get("/meals")
def list_meals(date: Optional[date] = None, db: Session = Depends(get_db)):
    q = db.query(MealRecord)
    if date:
        q = q.filter(MealRecord.date == date)
    return q.order_by(desc(MealRecord.date), MealRecord.meal_type).all()


@router.post("/meals")
def create_meal(meal: MealCreate, db: Session = Depends(get_db)):
    db_meal = MealRecord(**meal.dict())
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal


@router.put("/meals/{meal_id}")
def update_meal(meal_id: int, meal: MealCreate, db: Session = Depends(get_db)):
    db_meal = db.query(MealRecord).filter(MealRecord.id == meal_id).first()
    if not db_meal:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in meal.dict().items():
        setattr(db_meal, field, value)
    db.commit()
    db.refresh(db_meal)
    return db_meal


@router.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(MealRecord).filter(MealRecord.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(meal)
    db.commit()
    return {"ok": True}


# AI 占位接口
@router.post("/meals/{meal_id}/ai-calculate")
def ai_calculate_nutrition(meal_id: int):
    return {"message": "AI 功能待实装", "available": False}


# ── 饮水 ──────────────────────────────────────────────
@router.get("/water/{date}")
def get_water(date: date, db: Session = Depends(get_db)):
    record = db.query(WaterRecord).filter(WaterRecord.date == date).first()
    return record or {"date": date, "cups": 0, "ml": 0}


@router.post("/water/add-cup")
def add_cup(date: date, db: Session = Depends(get_db)):
    record = db.query(WaterRecord).filter(WaterRecord.date == date).first()
    if record:
        record.cups += 1
        record.ml += 250
    else:
        record = WaterRecord(date=date, cups=1, ml=250)
        db.add(record)
    db.commit()
    db.refresh(record)
    return record
