from sqlalchemy import Column, Integer, String, Text, Date, DateTime
from sqlalchemy.sql import func
from database import Base


class UserLanguage(Base):
    __tablename__ = "user_languages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)    # 显示名称，如"日语"
    code = Column(String(50), nullable=False, unique=True)  # 唯一标识，如"japanese"
    emoji = Column(String(10), nullable=True)    # 如"🇯🇵"
    created_at = Column(DateTime, server_default=func.now())


class StudyCheckin(Base):
    __tablename__ = "study_checkins"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String(10), nullable=False)   # japanese / english
    date = Column(Date, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)
    apps_used = Column(String(500), nullable=True)  # 逗号分隔
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StudyGoal(Base):
    __tablename__ = "study_goals"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)      # JLPT N1 / 英语六级
    target_date = Column(Date, nullable=True)
    progress_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StudyResource(Base):
    __tablename__ = "study_resources"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String(10), nullable=False)
    title = Column(String(200), nullable=False)
    url = Column(String(500), nullable=True)
    resource_type = Column(String(20), nullable=False)  # 教材 / 网站 / 视频 / App
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
