from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from database import Base


class GroceryPrice(Base):
    """价格记录"""
    __tablename__ = "grocery_prices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)       # 品名
    category = Column(String(20), nullable=True)     # 种类：肉类/蔬菜/水果/海鲜
    subcategory = Column(String(20), nullable=True)  # 子类（仅肉类）：牛肉/鸡肉/猪肉/其他
    price = Column(Float, nullable=False)            # 用户输入的价格
    tax_type = Column(String(10), default="税后")    # 税前/税后
    discount = Column(Float, default=0)              # 折扣率 0~0.5，0=不打折
    quantity = Column(Float, default=1)              # 数量（个/盒等可数单位时用）
    unit = Column(String(20), default="斤")          # 单位
    origin = Column(String(100), nullable=True)      # 产地
    store = Column(String(100), nullable=True)       # 购买地点
    date = Column(Date, nullable=False)              # 购买日期
    notes = Column(String(200), nullable=True)       # 备注
    created_at = Column(DateTime, server_default=func.now())
