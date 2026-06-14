from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(10), nullable=False)     # 收入 / 支出
    amount = Column(Float, nullable=False)
    currency = Column(String(5), default="JPY")  # JPY / USD / CNY
    category = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    asset_type = Column(String(20), nullable=False)  # 存款 / 基金 / 股票 / 现金 / 负债
    amount = Column(Float, nullable=False)
    currency = Column(String(5), default="JPY")
    investment_category = Column(String(20), nullable=True)  # 绑定投资分类：基金/A股/日股/美股
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    category = Column(String(50), nullable=False)  # "总计" 或具体分类
    amount = Column(Float, nullable=False)


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0)
    currency = Column(String(5), default="JPY")
    deadline = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
