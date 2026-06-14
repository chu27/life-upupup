from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class InvestmentItem(Base):
    """投资条目（如：某只基金、某只股票）"""
    __tablename__ = "investment_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)       # 名称，如"沪深300基金"
    category = Column(String(20), default="基金")    # 美股 / 日股 / A股 / 基金
    currency = Column(String(10), default="JPY")     # 货币
    notes = Column(String(200), nullable=True)       # 备注
    created_at = Column(DateTime, server_default=func.now())


class InvestmentLog(Base):
    """每日金额记录"""
    __tablename__ = "investment_logs"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("investment_items.id"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)           # 当日账户显示金额
    created_at = Column(DateTime, server_default=func.now())
