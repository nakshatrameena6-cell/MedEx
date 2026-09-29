import argparse
import datetime
import random
import sys
from sqlalchemy.orm import Session

from app.db.database import Base, SessionLocal, engine
from app.db.models import (
    Alert, AuditLog, BedStatus, DiseaseSignals, DrugMaster, DrugNameMap,
    Facility, IssuesReceipts, OPDFootfall, StaffAttendance, StockSnapshot,
    Transfer, WeatherDaily
)

DEMO_DATA_VERSION = 1
DISCLAIMER = """
================================================================================
SYNTHETIC DEMO DATA — NOT REAL HEALTH DATA
This environment uses synthetic demo health-supply-chain data for MedEx / AushadhiGrid.
It contains NO patient identifiers and is not operational health data.
================================================================================
"""

# States, Districts, Blocks definition
LOCATION_HIERARCHY = [
    {
        "state_id": "TN",
        "state_name": "Tamil Nadu",
        "base_lat": 12.83,
        "base_lng": 79.70,
        "districts": [
            {"district_id": "TN-D01", "name": "Kanchipuram", "blocks": ["TN-B01", "TN-B02", "TN-B03"]},
            {"district_id": "TN-D02", "name": "Chengalpattu", "blocks": ["TN-B04", "TN-B05", "TN-B06"]},
            {"district_id": "TN-D03", "name": "Vellore", "blocks": ["TN-B07", "TN-B08", "TN-B09"]}
        ]
    },
    {
        "state_id": "BR",
        "state_name": "Bihar",
        "base_lat": 25.59,
        "base_lng": 85.13,
        "districts": [
            {"district_id": "BR-D01", "name": "Patna", "blocks": ["BR-B01", "BR-B02", "BR-B03"]},
            {"district_id": "BR-D02", "name": "Gaya", "blocks": ["BR-B04", "BR-B05", "BR-B06"]},
            {"district_id": "BR-D03", "name": "Muzaffarpur", "blocks": ["BR-B07", "BR-B08", "BR-B09"]}
        ]
    },
    {
        "state_id": "MH",
        "state_name": "Maharashtra",
        "base_lat": 18.52,
        "base_lng": 73.85,
        "districts": [
            {"district_id": "MH-D01", "name": "Pune", "blocks": ["MH-B01", "MH-B02", "MH-B03"]},
            {"district_id": "MH-D02", "name": "Nashik", "blocks": ["MH-B04", "MH-B05", "MH-B06"]},
            {"district_id": "MH-D03", "name": "Nagpur", "blocks": ["MH-B07", "MH-B08", "MH-B09"]}
        ]
    }
]

DRUG_CATALOGUE = [
    {"drug_code": "ORS", "drug_name": "Oral Rehydration Salts", "generic_name": "Oral Rehydration Salts", "unit": "sachet", "criticality": 1, "base_unit": "sachet", "is_essential": True},
    {"drug_code": "PARA", "drug_name": "Paracetamol 500mg", "generic_name": "Paracetamol", "unit": "tablet", "criticality": 1, "base_unit": "tablet", "is_essential": True},
    {"drug_code": "AMOX", "drug_name": "Amoxicillin 500mg", "generic_name": "Amoxicillin", "unit": "capsule", "criticality": 2, "base_unit": "capsule", "is_essential": True},
    {"drug_code": "AZI", "drug_name": "Azithromycin 500mg", "generic_name": "Azithromycin", "unit": "tablet", "criticality": 2, "base_unit": "tablet", "is_essential": True},
    {"drug_code": "CEF", "drug_name": "Cefixime 200mg", "generic_name": "Cefixime", "unit": "tablet", "criticality": 2, "base_unit": "tablet", "is_essential": True},
    {"drug_code": "RIF", "drug_name": "Rifampicin 450mg", "generic_name": "Rifampicin", "unit": "capsule", "criticality": 1, "base_unit": "capsule", "is_essential": True},
    {"drug_code": "ART", "drug_name": "Artesunate 60mg", "generic_name": "Artesunate", "unit": "vial", "criticality": 1, "base_unit": "vial", "is_essential": True},
    {"drug_code": "INS", "drug_name": "Human Insulin 40IU/ml", "generic_name": "Insulin", "unit": "vial", "criticality": 1, "base_unit": "vial", "is_essential": True},
    {"drug_code": "SALINE", "drug_name": "Normal Saline 0.9% 500ml", "generic_name": "Sodium Chloride Solution", "unit": "bottle", "criticality": 1, "base_unit": "bottle", "is_essential": True},
    {"drug_code": "ZINC", "drug_name": "Zinc Sulfate 20mg", "generic_name": "Zinc Sulfate", "unit": "tablet", "criticality": 2, "base_unit": "tablet", "is_essential": True}
]

DRUG_ALIASES = [
    ("ORS", "ORS"), ("ors", "ORS"), ("oral rehydration", "ORS"), ("oral rehydration salts", "ORS"),
    ("paracetamol", "PARA"), ("para", "PARA"), ("pcm", "PARA"), ("paracetamol 500mg", "PARA"),
    ("amoxicillin", "AMOX"), ("amox", "AMOX"), ("amox 500", "AMOX"),
    ("azithromycin", "AZI"), ("azi", "AZI"), ("azithro", "AZI"),
    ("cefixime", "CEF"), ("cef", "CEF"),
    ("rifampicin", "RIF"), ("rif", "RIF"),
    ("artesunate", "ART"), ("art", "ART"),
    ("insulin", "INS"), ("ins", "INS"),
    ("saline", "SALINE"), ("normal saline", "SALINE"),
    ("zinc", "ZINC"), ("zinc tablet", "ZINC"), ("zinc sulfate", "ZINC")
]


def seed_database(db: Session, reset: bool = False):
    random.seed(42)

    if reset:
        print("Resetting database tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    else:
        Base.metadata.create_all(bind=engine)

    print(DISCLAIMER)
    print(f"Seeding AushadhiGrid synthetic demo database (version {DEMO_DATA_VERSION})...")

    # 1. Seed Drug Master
    for d in DRUG_CATALOGUE:
        if not db.query(DrugMaster).filter(DrugMaster.drug_code == d["drug_code"]).first():
            db.add(DrugMaster(**d))
    db.commit()
    print("Seeded Drug Master (10 essential drugs).")

    # 2. Seed Drug Name Aliases
    for alias, code in DRUG_ALIASES:
        if not db.query(DrugNameMap).filter(DrugNameMap.alias == alias).first():
            db.add(DrugNameMap(alias=alias, drug_code=code, language="en", confidence=1.0))
    db.commit()
    print("Seeded Drug Name Aliases.")

    # 3. Seed Facilities (108 facilities across 3 states x 3 districts x 3 blocks x 4 PHCs)
    facilities_list = []
    facility_counter = 1

    for state in LOCATION_HIERARCHY:
        st_id = state["state_id"]
        base_lat = state["base_lat"]
        base_lng = state["base_lng"]

        for dist_idx, dist in enumerate(state["districts"]):
            d_id = dist["district_id"]

            for b_idx, block_id in enumerate(dist["blocks"]):
                for p in range(1, 5):
                    fac_id = f"{st_id}-PHC-{facility_counter:03d}"
                    facility_counter += 1

                    # Determine stock archetype/scenario
                    stock_status = "NORMAL"
                    road_status = "ACCESSIBLE"

                    if fac_id == "TN-PHC-001":
                        stock_status = "NORMAL"
                    elif fac_id == "TN-PHC-002":
                        stock_status = "CRITICAL"  # Shortage trend demo
                    elif fac_id == "TN-PHC-003":
                        stock_status = "SURPLUS"   # Donor surplus demo
                    elif fac_id == "TN-PHC-004":
                        stock_status = "AT_RISK"   # Delayed reporting / near expiry
                    elif fac_id == "MH-PHC-001":
                        road_status = "CONSTRAINED"

                    fac = Facility(
                        facility_id=fac_id,
                        name=f"{dist['name']} PHC #{p}",
                        state_id=st_id,
                        district_id=d_id,
                        block_id=block_id,
                        facility_type="PHC" if p <= 3 else "CHC",
                        latitude=round(base_lat + (dist_idx * 0.1) + (b_idx * 0.02) + (p * 0.005), 4),
                        longitude=round(base_lng + (dist_idx * 0.1) + (b_idx * 0.02) + (p * 0.005), 4),
                        population_served=random.randint(15000, 35000),
                        bed_capacity=random.choice([6, 10, 20]),
                        is_active=True,
                        road_access_status=road_status,
                        stock_status=stock_status,
                        dataset_type="synthetic_demo"
                    )
                    db.add(fac)
                    facilities_list.append(fac)

    db.commit()
    print(f"Seeded {len(facilities_list)} Facilities across 3 states and 9 districts.")

    # 4. Seed 56 days of Stock Snapshots and Supporting Operational Data
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=55)

    print("Seeding 56 days of stock history and operational data...")

    stock_snapshots = []
    issues_receipts = []
    opd_records = []
    staff_records = []
    bed_records = []

    for fac in facilities_list:
        fac_id = fac.facility_id

        for day_idx in range(56):
            cur_date = start_date + datetime.timedelta(days=day_idx)

            # OPD Footfall & Staffing & Bed
            opd = OPDFootfall(
                facility_id=fac_id,
                date=cur_date,
                patient_count=random.randint(60, 180)
            )
            opd_records.append(opd)

            staff = StaffAttendance(
                facility_id=fac_id,
                date=cur_date,
                staff_present=random.randint(7, 10),
                staff_expected=10
            )
            staff_records.append(staff)

            bed = BedStatus(
                facility_id=fac_id,
                date=cur_date,
                beds_total=fac.bed_capacity,
                beds_occupied=random.randint(2, min(fac.bed_capacity, 9))
            )
            bed_records.append(bed)

            # Stock Snapshots per Drug
            for drug in DRUG_CATALOGUE:
                code = drug["drug_code"]

                # Base quantity logic depending on archetype
                if fac_id == "TN-PHC-002" and code == "ORS":
                    # Declining trend leading to shortage (400 down to 10)
                    qty = max(10, int(400 - (day_idx * 7)))
                elif fac_id == "TN-PHC-003" and code == "ORS":
                    # Surplus ORS stock
                    qty = 5000 + random.randint(0, 200)
                elif fac_id == "TN-PHC-004" and code == "PARA":
                    # Near expiry stock
                    qty = 150
                else:
                    qty = random.randint(120, 800)

                usable = max(0, qty - random.randint(0, 10))
                exp_date = today + datetime.timedelta(days=random.randint(15, 365))
                if fac_id == "TN-PHC-004" and code == "PARA":
                    exp_date = today + datetime.timedelta(days=5)  # Expiring in 5 days

                snap = StockSnapshot(
                    facility_id=fac_id,
                    drug_code=code,
                    snapshot_date=cur_date,
                    quantity=qty,
                    usable_quantity=usable,
                    expiry_date=exp_date,
                    batch_id=f"BAT-{code}-{random.randint(100, 999)}",
                    reported_at=datetime.datetime.combine(cur_date, datetime.time(9, 0)),
                    source="SYSTEM"
                )
                stock_snapshots.append(snap)

                # Daily issue / receipt
                ir = IssuesReceipts(
                    facility_id=fac_id,
                    drug_code=code,
                    date=cur_date,
                    quantity=random.randint(10, 50),
                    transaction_type="ISSUE"
                )
                issues_receipts.append(ir)

    # Bulk insert in batches for performance
    db.bulk_save_objects(stock_snapshots)
    db.bulk_save_objects(opd_records)
    db.bulk_save_objects(staff_records)
    db.bulk_save_objects(bed_records)
    db.bulk_save_objects(issues_receipts)
    db.commit()
    print("Seeded Stock Snapshots and Operational Records.")

    # 5. Seed Daily Weather & Disease Signals (9 districts x 56 days)
    weather_list = []
    disease_list = []

    for state in LOCATION_HIERARCHY:
        for dist in state["districts"]:
            d_id = dist["district_id"]
            for day_idx in range(56):
                cur_date = start_date + datetime.timedelta(days=day_idx)

                w = WeatherDaily(
                    location_id=d_id,
                    district_id=d_id,
                    date=cur_date,
                    temperature=round(28.0 + random.uniform(-3, 4), 1),
                    rainfall=round(max(0.0, random.uniform(-10, 40)), 1),
                    humidity=round(random.uniform(60.0, 90.0), 1)
                )
                weather_list.append(w)

                # Disease signal with seasonal uplift
                diarrhea_val = round(1.0 + (day_idx * 0.05) + random.uniform(-0.2, 0.3), 2)
                disease = DiseaseSignals(
                    district_id=d_id,
                    date=cur_date,
                    disease="Diarrhoeal illness",
                    signal_value=diarrhea_val,
                    signal_level="ELEVATED" if diarrhea_val > 2.5 else "NORMAL"
                )
                disease_list.append(disease)

    db.bulk_save_objects(weather_list)
    db.bulk_save_objects(disease_list)
    db.commit()
    print("Seeded Weather and Disease Signals.")

    # 6. Seed Demo Transfers
    transfers = [
        Transfer(
            transfer_id="TRF-001",
            source_facility_id="TN-PHC-003",
            destination_facility_id="TN-PHC-002",
            drug_code="ORS",
            quantity=500,
            status="OPEN",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
            reason="Redistribution proposal from surplus TN-PHC-003 to shortage TN-PHC-002",
            created_by="district_admin"
        ),
        Transfer(
            transfer_id="TRF-002",
            source_facility_id="TN-PHC-001",
            destination_facility_id="TN-PHC-004",
            drug_code="PARA",
            quantity=200,
            status="APPROVED",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
            reason="Stock balancing",
            created_by="district_admin",
            approved_by="state_officer"
        )
    ]
    for tr in transfers:
        db.add(tr)
    db.commit()
    print("Seeded Demo Transfers.")

    # 7. Seed Demo Alerts
    alerts = [
        Alert(
            alert_id="ALT-001",
            alert_type="STOCKOUT_RISK",
            severity="RED",
            state_id="TN",
            district_id="TN-D01",
            block_id="TN-B01",
            facility_id="TN-PHC-002",
            drug_code="ORS",
            message="CRITICAL: ORS stock depletion trend. Estimated stockout in 3 days at TN-PHC-002.",
            status="ACTIVE",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        ),
        Alert(
            alert_id="ALT-002",
            alert_type="NEAR_EXPIRY",
            severity="AMBER",
            state_id="TN",
            district_id="TN-D01",
            block_id="TN-B01",
            facility_id="TN-PHC-004",
            drug_code="PARA",
            message="WARNING: 150 tablets of Paracetamol 500mg near expiry at TN-PHC-004.",
            status="ACTIVE",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)
        )
    ]
    for al in alerts:
        db.add(al)
    db.commit()
    print("Seeded Demo Alerts.")

    # 8. Seed Audit Log
    audit = AuditLog(
        user_id="system_seed",
        role="STATE",
        action="SEED_DATABASE",
        resource="database",
        resource_id=f"v{DEMO_DATA_VERSION}",
        result="SUCCESS",
        details={"version": DEMO_DATA_VERSION, "facilities": len(facilities_list), "district": "ALL"}
    )
    db.add(audit)
    db.commit()
    print("Seeded Audit Log.")
    print("Seeding complete! Database is fully populated with synthetic demo universe.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed AushadhiGrid synthetic demo database")
    parser.add_argument("--reset", action="store_true", help="Clear existing database tables before seeding")
    args = parser.parse_args()

    db_session = SessionLocal()
    try:
        seed_database(db_session, reset=args.reset)
    finally:
        db_session.close()
