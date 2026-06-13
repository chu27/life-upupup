from sqlalchemy import Column, Integer, Float, Date, DateTime
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
