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


class GrammarEntry(Base):
    __tablename__ = "grammar_entries"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)        # 语法点，如「～ながら」
    explanation = Column(Text, nullable=True)          # 说明
    example = Column(Text, nullable=True)              # 例句
    mastery = Column(Integer, default=0)               # 掌握程度 0未学 1学习中 2已掌握
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class VocabEntry(Base):
    __tablename__ = "vocab_entries"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String(50), nullable=False)
    word = Column(String(200), nullable=False)         # 单词
    reading = Column(String(200), nullable=True)       # 读音（假名/拼音）
    meaning = Column(Text, nullable=True)              # 释义
    example = Column(Text, nullable=True)              # 例句
    mastery = Column(Integer, default=0)               # 掌握程度 0未学 1学习中 2已掌握
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class SentenceEntry(Base):
    __tablename__ = "sentence_entries"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String(50), nullable=False)
    sentence = Column(Text, nullable=False)            # 句子（原文）
    meaning = Column(Text, nullable=True)              # 中文意思
    notes = Column(Text, nullable=True)               # 备注笔记
    mastery = Column(Integer, default=0)               # 掌握程度 0未学 1学习中 2已掌握
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
