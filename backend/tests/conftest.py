import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal
from app.db.seed import seed_database


@pytest.fixture(autouse=True)
def setup_db_for_test():
    db = SessionLocal()
    seed_database(db, reset=True)
    db.close()


@pytest.fixture
def client():
    return TestClient(app)
