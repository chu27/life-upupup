from sqlalchemy import Column, Integer, String, Text, Date, DateTime
from sqlalchemy.sql import func
from database import Base


class Documentary(Base):
    __tablename__ = "documentaries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    status = Column(String(20), default="想看")  # 想看 / 已看
    rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    platform = Column(String(100), nullable=True)
    video_url = Column(String(500), nullable=True)
    tags = Column(String(500), nullable=True)
    watch_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
