import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, JSON
from app.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    result = Column(String(50), nullable=False, default="SUCCESS")
    details = Column(JSON, nullable=True)


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String(100), primary_key=True, index=True)  # e.g., TN-PHC-014
    name = Column(String(200), nullable=False)
    district_id = Column(String(50), nullable=False, index=True)  # e.g., TN-D01
    block_id = Column(String(50), nullable=False, index=True)  # e.g., TN-B01
    facility_type = Column(String(50), nullable=False)  # PHC, CHC, DH
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    facility_id = Column(String(100), nullable=False, index=True)
    drug_id = Column(String(100), nullable=False, index=True)  # e.g., ORS, PARACETAMOL
    quantity = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=100)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
