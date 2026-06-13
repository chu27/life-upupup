from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.tasks import DailyTask

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    title: str
    period: str  # today / week / month / year
    module_tag: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    module_tag: Optional[str] = None


@router.get("")
def list_tasks(period: str, db: Session = Depends(get_db)):
    return db.query(DailyTask).filter(DailyTask.period == period).order_by(DailyTask.is_done, DailyTask.id).all()


@router.post("")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = DailyTask(
        title=task.title,
        period=task.period,
        module_tag=task.module_tag,
        date=date.today(),
    )
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


@router.post("/ai-generate")
def ai_generate_tasks(period: str):
    return {"message": "AI 功能待实装", "available": False}
