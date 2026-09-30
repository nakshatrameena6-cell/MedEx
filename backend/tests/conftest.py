import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.db.database as db_module
from app.main import app
from app.db.database import get_db, Base
from app.db.seed import seed_database
from app.db.models import Transfer, StockSnapshot

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Patch global SessionLocal & engine in app.db.database for test session
db_module.engine = engine
db_module.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        seed_database(db, reset=True)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def override_get_db():
    def _get_test_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_transfer_states_between_tests():
    yield
    # Reset modified transfers back to OPEN state so tests remain order-independent
    db = TestingSessionLocal()
    try:
        transfers = db.query(Transfer).all()
        for t in transfers:
            if t.status in ("APPROVED", "REJECTED", "ESCALATED", "CLOSED"):
                t.status = "OPEN"
                t.decided_by = None
                t.approved_by = None
        db.query(StockSnapshot).filter(StockSnapshot.source == "CAPTURED").delete()
        db.commit()
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)
