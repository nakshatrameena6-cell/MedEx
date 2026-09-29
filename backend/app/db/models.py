import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, JSON
from app.db.database import Base


class Facility(Base):
    __tablename__ = "facilities"

    facility_id = Column(String(100), primary_key=True, index=True)  # e.g., TN-PHC-001
    name = Column(String(200), nullable=False)
    state_id = Column(String(50), nullable=False, index=True)  # e.g., TN, BR, MH
    district_id = Column(String(50), nullable=False, index=True)  # e.g., TN-D01
    block_id = Column(String(50), nullable=False, index=True)  # e.g., TN-B01
    facility_type = Column(String(50), nullable=False)  # PHC, CHC, DH
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    population_served = Column(Integer, default=25000)
    bed_capacity = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    road_access_status = Column(String(50), default="ACCESSIBLE")  # ACCESSIBLE, CONSTRAINED, BLOCKED
    stock_status = Column(String(50), default="NORMAL")  # NORMAL, AT_RISK, CRITICAL, SURPLUS
    dataset_type = Column(String(50), default="synthetic_demo")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DrugMaster(Base):
    __tablename__ = "drug_master"

    drug_code = Column(String(50), primary_key=True, index=True)  # ORS, PARA, AMOX, AZI, CEF, RIF, ART, INS, SALINE, ZINC
    drug_name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=False)
    unit = Column(String(50), nullable=False)  # sachet, tablet, vial, bottle
    criticality = Column(Integer, default=1)  # 1=CRITICAL, 2=HIGH, 3=MEDIUM
    base_unit = Column(String(50), default="unit")
    is_essential = Column(Boolean, default=True)


class DrugNameMap(Base):
    __tablename__ = "drug_name_map"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alias = Column(String(100), nullable=False, index=True)
    drug_code = Column(String(50), ForeignKey("drug_master.drug_code"), nullable=False, index=True)
    language = Column(String(20), default="en")
    confidence = Column(Float, default=1.0)


class StockSnapshot(Base):
    __tablename__ = "stock_snapshots"

    snapshot_id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    drug_code = Column(String(50), ForeignKey("drug_master.drug_code"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    usable_quantity = Column(Integer, nullable=False)
    expiry_date = Column(Date, nullable=True)
    batch_id = Column(String(50), nullable=True)
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String(50), default="SYSTEM")


class IssuesReceipts(Base):
    __tablename__ = "issues_receipts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    drug_code = Column(String(50), ForeignKey("drug_master.drug_code"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    transaction_type = Column(String(20), nullable=False)  # ISSUE, RECEIPT


class OPDFootfall(Base):
    __tablename__ = "opd_footfall"

    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    patient_count = Column(Integer, nullable=False)


class StaffAttendance(Base):
    __tablename__ = "staff_attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    staff_present = Column(Integer, nullable=False)
    staff_expected = Column(Integer, nullable=False)


class BedStatus(Base):
    __tablename__ = "bed_status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    beds_total = Column(Integer, nullable=False)
    beds_occupied = Column(Integer, nullable=False)


class WeatherDaily(Base):
    __tablename__ = "weather_daily"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(String(50), nullable=False)
    district_id = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)


class DiseaseSignals(Base):
    __tablename__ = "disease_signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    disease = Column(String(50), nullable=False)  # Dengue, Diarrhoeal, Respiratory
    signal_value = Column(Float, nullable=False)
    signal_level = Column(String(20), nullable=False)  # NORMAL, ELEVATED, HIGH, SPIKE


class Transfer(Base):
    __tablename__ = "transfers"

    transfer_id = Column(String(100), primary_key=True, index=True)
    source_facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    destination_facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    drug_code = Column(String(50), ForeignKey("drug_master.drug_code"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, UNDER_REVIEW, ESCALATED, APPROVED, IN_TRANSIT, RECEIVED, CLOSED, REJECTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    eta = Column(DateTime, nullable=True)
    cost = Column(Float, default=0.0)
    reason = Column(String(255), nullable=True)
    created_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(String(100), primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False)  # STOCKOUT_RISK, LOW_STOCK, NEAR_EXPIRY, LATE_REPORTING
    severity = Column(String(20), nullable=False)  # AMBER, RED
    state_id = Column(String(50), nullable=False, index=True)
    district_id = Column(String(50), nullable=False, index=True)
    block_id = Column(String(50), nullable=True, index=True)
    facility_id = Column(String(100), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    drug_code = Column(String(50), nullable=True)
    message = Column(String(255), nullable=False)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    result = Column(String(50), nullable=False, default="SUCCESS")
    details = Column(JSON, nullable=True)


# Alias StockItem for legacy schema compatibility
StockItem = StockSnapshot
