from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from database import Base


class DailyTask(Base):
    __tablename__ = "daily_tasks"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    title = Column(String(200), nullable=False)
    module_tag = Column(String(50), nullable=True)  # 读书 / 日语 / 饮食 …
    period = Column(String(10), nullable=False, default='today')  # today / week / month / year
    is_done = Column(Integer, default=0)            # 0=未完成 1=已完成
    is_ai_generated = Column(Integer, default=0)    # 0=手动 1=AI生成（预留）
    created_at = Column(DateTime, server_default=func.now())
