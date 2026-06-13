from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.tasks import DailyTask

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    date: date
    title: str
    module_tag: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    module_tag: Optional[str] = None
    date: Optional[date] = None


@router.get("")
def list_tasks(
    date: Optional[date] = None,
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(DailyTask)
    if date:
        q = q.filter(DailyTask.date == date)
    elif start and end:
        q = q.filter(DailyTask.date >= start, DailyTask.date <= end)
    return q.order_by(DailyTask.date, DailyTask.is_done, DailyTask.id).all()


@router.post("")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = DailyTask(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.put("/{task_id}")
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(DailyTask).filter(DailyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}/toggle")
def toggle_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(DailyTask).filter(DailyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Not found")
    task.is_done = 0 if task.is_done else 1
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(DailyTask).filter(DailyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(task)
    db.commit()
    return {"ok": True}


# AI 占位接口
@router.post("/ai-generate")
def ai_generate_tasks(date: date):
    return {"message": "AI 功能待实装", "available": False}
