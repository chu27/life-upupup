from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func
from datetime import date, datetime

from database import get_db
from models.books import Book
from models.documentaries import Documentary
from models.body import BodyRecord
from models.diet import MealRecord, WaterRecord
from models.tasks import DailyTask
from models.language import StudyCheckin
from models.finance import Transaction, Budget

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/today")
def today_summary(db: Session = Depends(get_db)):
    today = date.today()
    now_year = today.year
    now_month = today.month

    # 今日体重
    body = db.query(BodyRecord).filter(BodyRecord.date == today).first()

    # 今日热量
    meals = db.query(MealRecord).filter(MealRecord.date == today).all()
    total_calories = sum(m.calories or 0 for m in meals)

    # 今日饮水
    water = db.query(WaterRecord).filter(WaterRecord.date == today).first()

    # 今日学习（日语+英语）
    checkins = db.query(StudyCheckin).filter(StudyCheckin.date == today).all()
    total_study_minutes = sum(c.duration_minutes for c in checkins)

    # 今日任务
    tasks = db.query(DailyTask).filter(DailyTask.date == today).all()
    done = sum(1 for t in tasks if t.is_done)

    # 本月概览
    books_this_month = db.query(func.count(Book.id)).filter(
        Book.status == "读完",
        extract("year", Book.finish_date) == now_year,
        extract("month", Book.finish_date) == now_month
    ).scalar()

    expense_this_month = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "支出",
        extract("year", Transaction.date) == now_year,
        extract("month", Transaction.date) == now_month
    ).scalar() or 0

    study_this_month = db.query(func.sum(StudyCheckin.duration_minutes)).filter(
        extract("year", StudyCheckin.date) == now_year,
        extract("month", StudyCheckin.date) == now_month
    ).scalar() or 0

    docs_this_month = db.query(func.count(Documentary.id)).filter(
        Documentary.status == "已看",
        extract("year", Documentary.watch_date) == now_year,
        extract("month", Documentary.watch_date) == now_month
    ).scalar()

    # 各模块最新动态
    latest_book = db.query(Book).order_by(desc(Book.updated_at)).first()
    latest_doc = db.query(Documentary).filter(Documentary.status == "已看").order_by(desc(Documentary.watch_date)).first()

    return {
        "today": {
            "date": today.isoformat(),
            "weight": body.weight if body else None,
            "calories": total_calories,
            "water_cups": water.cups if water else 0,
            "study_minutes": total_study_minutes,
            "tasks_total": len(tasks),
            "tasks_done": done,
        },
        "this_month": {
            "books_finished": books_this_month or 0,
            "expense_jpy": expense_this_month,
            "study_hours": round(study_this_month / 60, 1),
            "docs_watched": docs_this_month or 0,
        },
        "latest": {
            "book": {"title": latest_book.title, "status": latest_book.status} if latest_book else None,
            "documentary": {"title": latest_doc.title} if latest_doc else None,
        }
    }
