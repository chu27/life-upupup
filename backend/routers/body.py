from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.body import BodyRecord

router = APIRouter(prefix="/api/body", tags=["body"])


class BodyCreate(BaseModel):
    date: date
    weight: float
    waist: Optional[float] = None
    chest: Optional[float] = None
    hip: Optional[float] = None
    arm: Optional[float] = None
    leg: Optional[float] = None


@router.get("")
def list_records(db: Session = Depends(get_db)):
    return db.query(BodyRecord).order_by(desc(BodyRecord.date)).all()


@router.post("")
def upsert_record(record: BodyCreate, db: Session = Depends(get_db)):
    existing = db.query(BodyRecord).filter(BodyRecord.date == record.date).first()
    if existing:
        for field, value in record.dict().items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    db_record = BodyRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/latest")
def get_latest(db: Session = Depends(get_db)):
    return db.query(BodyRecord).order_by(desc(BodyRecord.date)).first()


@router.delete("/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(BodyRecord).filter(BodyRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(record)
    db.commit()
    return {"ok": True}
