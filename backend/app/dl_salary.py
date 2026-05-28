import os
import json
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model

from .schemas import SalaryRequest, SalaryIntelligenceResponse, CompensationBand

# Load model once at module import
MODEL_PATH = os.path.abspath(os.path.join(__file__, "../../models/salary_india_dl_model.h5"))
_model = load_model(MODEL_PATH)

# Load raw data to get feature columns (same preprocessing as training)
DATA_PATH = os.path.abspath(os.path.join(__file__, "../../data/india_salary_raw.json"))

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return pd.DataFrame(raw)

def preprocess(df: pd.DataFrame):
    df = pd.get_dummies(df, columns=["role", "location", "seniority"], drop_first=True)
    X = df.drop(columns=["salary"]).astype('float32')
    return X, df.columns.tolist()

# Prepare feature columns from the training set
_train_df = load_data()
_, _train_columns = preprocess(_train_df)

def _prepare_input(request: SalaryRequest) -> np.ndarray:
    # Create a one‑row dataframe matching training schema
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
    return df.values.astype('float32')

def predict(request: SalaryRequest) -> SalaryIntelligenceResponse:
    """Predict salary compensation using the trained DL model.
    Returns a SalaryIntelligenceResponse with simple derived bands.
    """
    X = _prepare_input(request)
    # Model returns a single regression value (base salary)
    pred_salary = float(_model.predict(X, verbose=0)[0][0])
    # Derive simple bands +/-10% for illustration
    p25 = int(pred_salary * 0.9)
    median = int(pred_salary)
    p75 = int(pred_salary * 1.1)
    base_band = CompensationBand(p25=p25, median=median, p75=p75)
    # Placeholder total compensation and other fields – can be refined later
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
