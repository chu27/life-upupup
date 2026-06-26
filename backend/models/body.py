from sqlalchemy import Column, Integer, Float, String, Text, Date, DateTime
from sqlalchemy.sql import func
from database import Base


class BodyRecord(Base):
    __tablename__ = "body_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    weight = Column(Float, nullable=False)        # kg
    waist = Column(Float, nullable=True)          # cm
    chest = Column(Float, nullable=True)
    hip = Column(Float, nullable=True)
    arm = Column(Float, nullable=True)
    leg = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class WorkoutCheckin(Base):
    __tablename__ = "workout_checkins"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    workout_type = Column(String(50), nullable=False)   # 跑步/力量训练/瑜伽/游泳/骑行/其他
    duration_minutes = Column(Integer, nullable=True)   # 时长（分钟）
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
