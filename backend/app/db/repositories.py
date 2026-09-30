from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session
from app.core.roles import UserContext, UserRole
from app.db.database import Base
from app.db.models import (
    Alert, AuditLog, BedStatus, DiseaseSignals, DrugMaster, DrugNameMap,
    Facility, IssuesReceipts, OPDFootfall, StaffAttendance, StockSnapshot,
    Transfer, WeatherDaily
)

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id_val: Any) -> Optional[T]:
        return self.db.query(self.model).filter(getattr(self.model, "facility_id", getattr(self.model, "id", None)) == id_val).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, obj: T) -> T:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj


class FacilityRepository(BaseRepository[Facility]):
    def __init__(self, db: Session):
        super().__init__(Facility, db)

    def get_scoped_query(self, ctx: UserContext):
        query = self.db.query(Facility)
        if ctx.role == UserRole.FACILITY:
            if ctx.facility_id:
                query = query.filter(Facility.facility_id == ctx.facility_id)
            elif ctx.district and ctx.district != "ALL":
                query = query.filter(Facility.district_id == ctx.district)
        elif ctx.role == UserRole.BLOCK:
            if ctx.block_id:
                query = query.filter(Facility.block_id == ctx.block_id)
            elif ctx.district and ctx.district != "ALL":
                query = query.filter(Facility.district_id == ctx.district)
        elif ctx.role == UserRole.DISTRICT:
            if ctx.district and ctx.district != "ALL":
                query = query.filter(Facility.district_id == ctx.district)
        elif ctx.role in (UserRole.STATE, UserRole.AUDITOR):
            if ctx.district and ctx.district != "ALL":
                query = query.filter(Facility.district_id == ctx.district)
        return query

    def filter_facilities(
        self,
        ctx: UserContext,
        state_id: Optional[str] = None,
        district_id: Optional[str] = None,
        block_id: Optional[str] = None,
        facility_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Facility]:
        query = self.get_scoped_query(ctx)
        if state_id:
            query = query.filter(Facility.state_id == state_id)
        if district_id:
            query = query.filter(Facility.district_id == district_id)
        if block_id:
            query = query.filter(Facility.block_id == block_id)
        if facility_type:
            query = query.filter(Facility.facility_type == facility_type)
        return query.offset(skip).limit(limit).all()

    def get_facility_by_id_scoped(self, ctx: UserContext, facility_id: str) -> Optional[Facility]:
        query = self.get_scoped_query(ctx)
        return query.filter(Facility.facility_id == facility_id).first()


class StockSnapshotRepository(BaseRepository[StockSnapshot]):
    def __init__(self, db: Session):
        super().__init__(StockSnapshot, db)

    def get_latest_stock_for_facility(self, facility_id: str) -> List[StockSnapshot]:
        # Subquery for max snapshot_date per drug_code for the facility
        subq = (
            self.db.query(
                StockSnapshot.drug_code,
                func.max(StockSnapshot.snapshot_date).label("max_date")
            )
            .filter(StockSnapshot.facility_id == facility_id)
            .group_by(StockSnapshot.drug_code)
            .subquery()
        )
        return (
            self.db.query(StockSnapshot)
            .join(
                subq,
                (StockSnapshot.drug_code == subq.c.drug_code) &
                (StockSnapshot.snapshot_date == subq.c.max_date)
            )
            .filter(StockSnapshot.facility_id == facility_id)
            .all()
        )


class TransferRepository(BaseRepository[Transfer]):
    def __init__(self, db: Session):
        super().__init__(Transfer, db)

    def get_scoped_transfers(self, ctx: UserContext, skip: int = 0, limit: int = 100) -> List[Transfer]:
        query = self.db.query(Transfer)
        if ctx.role == UserRole.FACILITY:
            if ctx.facility_id:
                query = query.filter(
                    (Transfer.source_facility_id == ctx.facility_id) |
                    (Transfer.destination_facility_id == ctx.facility_id)
                )
            else:
                # filter via facility district
                facility_ids = [f.facility_id for f in self.db.query(Facility.facility_id).filter(Facility.district_id == ctx.district).all()]
                query = query.filter(
                    (Transfer.source_facility_id.in_(facility_ids)) |
                    (Transfer.destination_facility_id.in_(facility_ids))
                )
        elif ctx.role == UserRole.BLOCK:
            if ctx.block_id:
                facility_ids = [f.facility_id for f in self.db.query(Facility.facility_id).filter(Facility.block_id == ctx.block_id).all()]
                query = query.filter(
                    (Transfer.source_facility_id.in_(facility_ids)) |
                    (Transfer.destination_facility_id.in_(facility_ids))
                )
            elif ctx.district and ctx.district != "ALL":
                facility_ids = [f.facility_id for f in self.db.query(Facility.facility_id).filter(Facility.district_id == ctx.district).all()]
                query = query.filter(
                    (Transfer.source_facility_id.in_(facility_ids)) |
                    (Transfer.destination_facility_id.in_(facility_ids))
                )
        elif ctx.role == UserRole.DISTRICT:
            if ctx.district and ctx.district != "ALL":
                facility_ids = [f.facility_id for f in self.db.query(Facility.facility_id).filter(Facility.district_id == ctx.district).all()]
                query = query.filter(
                    (Transfer.source_facility_id.in_(facility_ids)) |
                    (Transfer.destination_facility_id.in_(facility_ids))
                )
        elif ctx.role in (UserRole.STATE, UserRole.AUDITOR):
            if ctx.district and ctx.district != "ALL":
                facility_ids = [f.facility_id for f in self.db.query(Facility.facility_id).filter(Facility.district_id == ctx.district).all()]
                query = query.filter(
                    (Transfer.source_facility_id.in_(facility_ids)) |
                    (Transfer.destination_facility_id.in_(facility_ids))
                )
        return query.order_by(desc(Transfer.created_at)).offset(skip).limit(limit).all()


class AlertRepository(BaseRepository[Alert]):
    def __init__(self, db: Session):
        super().__init__(Alert, db)

    def get_scoped_alerts(self, ctx: UserContext, skip: int = 0, limit: int = 100) -> List[Alert]:
        query = self.db.query(Alert)
        if ctx.role == UserRole.FACILITY:
            if ctx.facility_id:
                query = query.filter(Alert.facility_id == ctx.facility_id)
            elif ctx.district and ctx.district != "ALL":
                query = query.filter(Alert.district_id == ctx.district)
        elif ctx.role == UserRole.BLOCK:
            if ctx.block_id:
                query = query.filter(Alert.block_id == ctx.block_id)
            elif ctx.district and ctx.district != "ALL":
                query = query.filter(Alert.district_id == ctx.district)
        elif ctx.role == UserRole.DISTRICT:
            if ctx.district and ctx.district != "ALL":
                query = query.filter(Alert.district_id == ctx.district)
        elif ctx.role in (UserRole.STATE, UserRole.AUDITOR):
            if ctx.district and ctx.district != "ALL":
                query = query.filter(Alert.district_id == ctx.district)
        return query.order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def get_scoped_logs(self, ctx: UserContext, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        logs = self.db.query(AuditLog).order_by(desc(AuditLog.timestamp)).all()
        if ctx.role == UserRole.DISTRICT and ctx.district and ctx.district != "ALL":
            logs = [log for log in logs if isinstance(log.details, dict) and log.details.get("district") in (ctx.district, "ALL")]
        elif ctx.role in (UserRole.STATE, UserRole.AUDITOR) and ctx.district and ctx.district != "ALL":
            logs = [log for log in logs if isinstance(log.details, dict) and log.details.get("district") in (ctx.district, "ALL")]
        return logs[skip:skip + limit]


class DrugMasterRepository(BaseRepository[DrugMaster]):
    def __init__(self, db: Session):
        super().__init__(DrugMaster, db)
