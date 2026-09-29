from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy.orm import Session
from app.db.database import Base
from app.db.models import AuditLog, Facility, StockItem

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id_val: Any) -> Optional[T]:
        return self.db.query(self.model).filter(self.model.id == id_val).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, obj: T) -> T:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def get_logs_by_district(self, district_id: str, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        if district_id == "ALL":
            return self.get_all(skip, limit)
        return self.db.query(AuditLog).filter(AuditLog.details["district"].astext == district_id).offset(skip).limit(limit).all()


class FacilityRepository(BaseRepository[Facility]):
    def __init__(self, db: Session):
        super().__init__(Facility, db)

    def get_by_district(self, district_id: str) -> List[Facility]:
        return self.db.query(Facility).filter(Facility.district_id == district_id).all()
