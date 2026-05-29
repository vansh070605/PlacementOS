import os
import json

from .schemas import SalaryRequest, SalaryIntelligenceResponse, CompensationBand

# Paths are resolved at import time (cheap) but heavy objects are lazy-loaded
MODEL_PATH = os.path.abspath(os.path.join(__file__, "../../models/salary_india_dl_model.h5"))
DATA_PATH  = os.path.abspath(os.path.join(__file__, "../../data/india_salary_raw.json"))

# Module-level sentinels – populated on first predict() call
_model = None
_train_columns = None


def _load_resources():
    """Load TensorFlow model and derive training column schema on first use."""
    global _model, _train_columns
    if _model is not None and _train_columns is not None:
        return

    import pandas as pd
    import numpy as np
    from tensorflow.keras.models import load_model  # noqa: F401 (imported for side-effects)

    _model = load_model(MODEL_PATH)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    df = pd.DataFrame(raw)
    df = pd.get_dummies(df, columns=["role", "location", "seniority"], drop_first=True)
    _train_columns = df.columns.tolist()

def _prepare_input(request: SalaryRequest):
    """Build the feature array for the model. Must be called after _load_resources()."""
    import pandas as pd
    import numpy as np

    data = {
        "role": request.role_title,
        "location": request.location,
        "seniority": request.experience_level,
        "experience_years": request.experience_years,
    }
    df = pd.DataFrame([data])
    df = pd.get_dummies(df, columns=["role", "location", "seniority"], drop_first=True)
    # Align columns with training columns, missing columns set to 0
    df = df.reindex(columns=_train_columns, fill_value=0)
    return df.values.astype("float32")


def predict(request: SalaryRequest) -> SalaryIntelligenceResponse:
    """Predict salary compensation using the trained DL model.
    Lazy-loads TensorFlow and pandas on first invocation so the server
    starts instantly and pays the heavy import cost only when needed.
    """
    _load_resources()

    X = _prepare_input(request)
    # Model returns a single regression value (base salary)
    pred_salary = float(_model.predict(X, verbose=0)[0][0])
    # Derive simple bands +/-10% for illustration
    p25 = int(pred_salary * 0.9)
    median = int(pred_salary)
    p75 = int(pred_salary * 1.1)
    base_band = CompensationBand(p25=p25, median=median, p75=p75)
    # Placeholder total compensation and other fields
    total_band = CompensationBand(p25=int(p25 * 1.2), median=int(median * 1.2), p75=int(p75 * 1.2))
    return SalaryIntelligenceResponse(
        base_salary_band=base_band,
        total_comp_band=total_band,
        equity_range="$10K–$30K RSUs over 4 years",
        signing_bonus_range="$5K–$15K one‑time",
        negotiation_floor=int(p25 * 0.95),
        negotiation_ceiling=int(p75 * 1.05),
        negotiation_script="I am looking for a base salary in the range we discussed, aligned with market data for this role.",
        market_insights=["India tech salaries have risen 12% YoY in 2024.", "Mid‑senior roles in Bangalore command higher premiums."]
    )
