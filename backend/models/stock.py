from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    buy_price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    buy_date = Column(Date, nullable=False)
    sell_price = Column(Float, nullable=True)
    sell_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, server_default=func.now())


class DailyPriceRecord(Base):
    __tablename__ = "daily_price_records"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False)
    date = Column(Date, nullable=False)
    high_price = Column(Float, nullable=True)
    high_time = Column(String(10), nullable=True)   # HH:MM
    low_price = Column(Float, nullable=True)
    low_time = Column(String(10), nullable=True)
    close_price = Column(Float, nullable=True)
    recorded_at = Column(DateTime, server_default=func.now())


class StockNote(Base):
    __tablename__ = "stock_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
