from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.documentaries import Documentary

router = APIRouter(prefix="/api/documentaries", tags=["documentaries"])


class DocCreate(BaseModel):
    title: str
    status: str = "想看"
    rating: Optional[int] = None
    notes: Optional[str] = None
    platform: Optional[str] = None
    video_url: Optional[str] = None
    tags: Optional[str] = None
    watch_date: Optional[date] = None


class DocUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    platform: Optional[str] = None
    video_url: Optional[str] = None
    tags: Optional[str] = None
    watch_date: Optional[date] = None


@router.get("")
def list_docs(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Documentary)
    if status:
        q = q.filter(Documentary.status == status)
    return q.order_by(desc(Documentary.updated_at)).all()


@router.post("")
def create_doc(doc: DocCreate, db: Session = Depends(get_db)):
    db_doc = Documentary(**doc.dict())
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


@router.get("/{doc_id}")
def get_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Documentary).filter(Documentary.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


@router.put("/{doc_id}")
def update_doc(doc_id: int, doc: DocUpdate, db: Session = Depends(get_db)):
    db_doc = db.query(Documentary).filter(Documentary.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in doc.dict(exclude_unset=True).items():
        setattr(db_doc, field, value)
    db.commit()
    db.refresh(db_doc)
    return db_doc


@router.delete("/{doc_id}")
def delete_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Documentary).filter(Documentary.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(doc)
    db.commit()
    return {"ok": True}
