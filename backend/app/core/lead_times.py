"""
Centralized Lead Time and Safety Buffer Configuration for Essential Demo Drugs.
"""

from typing import Dict, Any

DRUG_LEAD_TIMES: Dict[str, Dict[str, int]] = {
    "ORS": {"lead_time_days": 4, "safety_buffer_days": 2},
    "PARA": {"lead_time_days": 5, "safety_buffer_days": 2},
    "AMOX": {"lead_time_days": 7, "safety_buffer_days": 3},
    "AZI": {"lead_time_days": 7, "safety_buffer_days": 3},
    "CEF": {"lead_time_days": 7, "safety_buffer_days": 3},
    "RIF": {"lead_time_days": 10, "safety_buffer_days": 5},
    "ART": {"lead_time_days": 5, "safety_buffer_days": 2},
    "INS": {"lead_time_days": 5, "safety_buffer_days": 3},
    "SALINE": {"lead_time_days": 3, "safety_buffer_days": 2},
    "ZINC": {"lead_time_days": 4, "safety_buffer_days": 2}
}

DEFAULT_LEAD_TIME: Dict[str, int] = {"lead_time_days": 5, "safety_buffer_days": 2}


def get_drug_lead_time_config(drug_code: str) -> Dict[str, int]:
    return DRUG_LEAD_TIMES.get(drug_code.upper(), DEFAULT_LEAD_TIME)
