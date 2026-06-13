from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float
from sqlalchemy.sql import func
from database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    status = Column(String(20), default="想读")  # 想读 / 在读 / 读完
    rating = Column(Integer, nullable=True)       # 1-5
    notes = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)     # 逗号分隔
    finish_date = Column(Date, nullable=True)
    last_read_at = Column(DateTime, nullable=True)  # 在读状态自动更新
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
