from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.language import StudyCheckin, StudyGoal, StudyResource, UserLanguage, GrammarEntry, VocabEntry, SentenceEntry

router = APIRouter(prefix="/api/language", tags=["language"])


class UserLanguageCreate(BaseModel):
    name: str
    code: str
    emoji: Optional[str] = None


# ── 语言管理 ──────────────────────────────────────────
@router.get("/list")
def list_languages(db: Session = Depends(get_db)):
    langs = db.query(UserLanguage).order_by(UserLanguage.id).all()
    # 如果还没有任何语言，自动初始化日语和英语
    if not langs:
        defaults = [
            UserLanguage(name="日语", code="japanese", emoji="🇯🇵"),
            UserLanguage(name="英语", code="english", emoji="🇬🇧"),
        ]
        for d in defaults:
            db.add(d)
        db.commit()
        langs = db.query(UserLanguage).order_by(UserLanguage.id).all()
    return langs


@router.post("/list")
def add_language(data: UserLanguageCreate, db: Session = Depends(get_db)):
    lang = UserLanguage(**data.dict())
    db.add(lang)
    db.commit()
    db.refresh(lang)
    return lang


@router.delete("/list/{lang_id}")
def delete_language(lang_id: int, db: Session = Depends(get_db)):
    lang = db.query(UserLanguage).filter(UserLanguage.id == lang_id).first()
    if not lang:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(lang)
    db.commit()
    return {"ok": True}


class CheckinCreate(BaseModel):
    language: str   # japanese / english
    date: date
    duration_minutes: int
    content: Optional[str] = None
    apps_used: Optional[str] = None


class GoalCreate(BaseModel):
    language: str
    name: str
    target_date: Optional[date] = None
    progress_notes: Optional[str] = None


class ResourceCreate(BaseModel):
    language: str
    title: str
    url: Optional[str] = None
    resource_type: str
    notes: Optional[str] = None


# ── 打卡 ──────────────────────────────────────────────
@router.get("/{language}/checkins")
def list_checkins(language: str, month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(StudyCheckin).filter(StudyCheckin.language == language)
    if year:
        q = q.filter(extract("year", StudyCheckin.date) == year)
    if month:
        q = q.filter(extract("month", StudyCheckin.date) == month)
    return q.order_by(desc(StudyCheckin.date)).all()


@router.post("/checkins")
def upsert_checkin(checkin: CheckinCreate, db: Session = Depends(get_db)):
    existing = db.query(StudyCheckin).filter(
        StudyCheckin.language == checkin.language,
        StudyCheckin.date == checkin.date
    ).first()
    if existing:
        for field, value in checkin.dict().items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    db_checkin = StudyCheckin(**checkin.dict())
    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)
    return db_checkin


# ── 目标 ──────────────────────────────────────────────
@router.get("/{language}/goals")
def list_goals(language: str, db: Session = Depends(get_db)):
    return db.query(StudyGoal).filter(StudyGoal.language == language).all()


@router.post("/goals")
def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    db_goal = StudyGoal(**goal.dict())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.put("/goals/{goal_id}")
def update_goal(goal_id: int, goal: GoalCreate, db: Session = Depends(get_db)):
    db_goal = db.query(StudyGoal).filter(StudyGoal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in goal.dict().items():
        setattr(db_goal, field, value)
    db.commit()
    db.refresh(db_goal)
    return db_goal


# ── 资源 ──────────────────────────────────────────────
@router.get("/{language}/resources")
def list_resources(language: str, db: Session = Depends(get_db)):
    return db.query(StudyResource).filter(StudyResource.language == language).all()


@router.post("/resources")
def create_resource(resource: ResourceCreate, db: Session = Depends(get_db)):
    db_resource = StudyResource(**resource.dict())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource


@router.delete("/resources/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(StudyResource).filter(StudyResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(resource)
    db.commit()
    return {"ok": True}


# ── 语法 ──────────────────────────────────────────────
class GrammarCreate(BaseModel):
    language: str
    title: str
    explanation: Optional[str] = None
    example: Optional[str] = None
    mastery: int = 0


@router.get("/{language}/grammar")
def list_grammar(language: str, db: Session = Depends(get_db)):
    return db.query(GrammarEntry).filter(GrammarEntry.language == language).order_by(desc(GrammarEntry.id)).all()


@router.post("/grammar")
def create_grammar(data: GrammarCreate, db: Session = Depends(get_db)):
    entry = GrammarEntry(**data.dict())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/grammar/{entry_id}")
def update_grammar(entry_id: int, data: GrammarCreate, db: Session = Depends(get_db)):
    entry = db.query(GrammarEntry).filter(GrammarEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.dict().items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/grammar/{entry_id}")
def delete_grammar(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(GrammarEntry).filter(GrammarEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}


# ── 单词 ──────────────────────────────────────────────
class VocabCreate(BaseModel):
    language: str
    word: str
    reading: Optional[str] = None
    meaning: Optional[str] = None
    example: Optional[str] = None
    mastery: int = 0


@router.get("/{language}/vocab")
def list_vocab(language: str, db: Session = Depends(get_db)):
    return db.query(VocabEntry).filter(VocabEntry.language == language).order_by(desc(VocabEntry.id)).all()


@router.post("/vocab")
def create_vocab(data: VocabCreate, db: Session = Depends(get_db)):
    entry = VocabEntry(**data.dict())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/vocab/{entry_id}")
def update_vocab(entry_id: int, data: VocabCreate, db: Session = Depends(get_db)):
    entry = db.query(VocabEntry).filter(VocabEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.dict().items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/vocab/{entry_id}")
def delete_vocab(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(VocabEntry).filter(VocabEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}


# ── 句子 ──────────────────────────────────────────────
class SentenceCreate(BaseModel):
    language: str
    sentence: str
    meaning: Optional[str] = None
    notes: Optional[str] = None
    mastery: int = 0


@router.get("/{language}/sentences")
def list_sentences(language: str, db: Session = Depends(get_db)):
    return db.query(SentenceEntry).filter(SentenceEntry.language == language).order_by(desc(SentenceEntry.id)).all()


@router.post("/sentences")
def create_sentence(data: SentenceCreate, db: Session = Depends(get_db)):
    entry = SentenceEntry(**data.dict())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/sentences/{entry_id}")
def update_sentence(entry_id: int, data: SentenceCreate, db: Session = Depends(get_db)):
    entry = db.query(SentenceEntry).filter(SentenceEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.dict().items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/sentences/{entry_id}")
def delete_sentence(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(SentenceEntry).filter(SentenceEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}
