from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from database import get_db
from models.books import Book

router = APIRouter(prefix="/api/books", tags=["books"])


class BookCreate(BaseModel):
    title: str
    status: str = "想读"
    rating: Optional[int] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    finish_date: Optional[date] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    finish_date: Optional[date] = None


@router.get("")
def list_books(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Book)
    if status:
        q = q.filter(Book.status == status)
    return q.order_by(desc(Book.updated_at)).all()


@router.post("")
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    db_book = Book(**book.dict())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


@router.get("/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.put("/{book_id}")
def update_book(book_id: int, book: BookUpdate, db: Session = Depends(get_db)):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = book.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_book, field, value)

    # 在读状态自动更新最后阅读时间
    if db_book.status == "在读":
        db_book.last_read_at = datetime.now()

    db.commit()
    db.refresh(db_book)
    return db_book


@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(book)
    db.commit()
    return {"ok": True}


# AI 占位接口（后续接 Claude API）
@router.post("/{book_id}/ai-summary")
def ai_summary(book_id: int):
    return {"message": "AI 功能待实装", "available": False}
