from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class MealRecord(Base):
    __tablename__ = "meal_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    meal_type = Column(String(20), nullable=False)  # 早餐 / 午餐 / 晚餐 / 加餐
    description = Column(Text, nullable=False)
    recipe_notes = Column(Text, nullable=True)
    ingredient_weight = Column(String(500), nullable=True)
    # AI 计算结果（暂时手动填写，后续接 Claude API）
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    ai_calculated = Column(Integer, default=0)  # 0=手动 1=AI估算
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class WaterRecord(Base):
    __tablename__ = "water_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    cups = Column(Integer, default=0)
    ml = Column(Integer, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class SupplementLog(Base):
    __tablename__ = "supplement_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    name = Column(String(100), nullable=False)       # 如：维生素D、鱼油、布洛芬
    type = Column(String(20), nullable=False)        # 营养品 / 药物
    dosage = Column(String(100), nullable=True)      # 如：1粒、500mg
    notes = Column(String(300), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
