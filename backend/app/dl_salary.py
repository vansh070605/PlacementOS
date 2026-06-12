import os
import logging
import numpy as np
from .schemas import SalaryRequest, SalaryIntelligenceResponse, CompensationBand
from .ml_models import local_models

logger = logging.getLogger("placementos.dl_salary")

def predict_deterministic(request: SalaryRequest) -> SalaryIntelligenceResponse:
    """Fallback rules-based prediction model in case DL model is not yet compiled."""
    role = request.role_title.strip()
    location = request.location.strip()
    level = request.experience_level.strip().lower()
    years = request.experience_years
    currency = getattr(request, "currency", "INR")
    if currency not in ("INR", "USD"):
        currency = "INR"

    bonus_pct = 0.10
    if level == "mid":
        bonus_pct = 0.15
    elif level == "senior":
        bonus_pct = 0.20
    elif level in ("staff", "principal"):
        bonus_pct = 0.25

    equity_pct = 0.10
    if level == "mid":
        equity_pct = 0.20
    elif level == "senior":
        equity_pct = 0.35
    elif level == "staff":
        equity_pct = 0.50
    elif level == "principal":
        equity_pct = 0.70

    if currency == "INR":
        if level == "entry":
            base_lpa = 6.0 + min(years, 3) * 1.5
        elif level == "mid":
            base_lpa = 12.0 + min(max(years - 2, 0), 5) * 2.0
        elif level == "senior":
            base_lpa = 22.0 + min(max(years - 5, 0), 6) * 3.5
        elif level == "staff":
            base_lpa = 42.0 + min(max(years - 8, 0), 8) * 5.0
        elif level == "principal":
            base_lpa = 70.0 + min(max(years - 12, 0), 10) * 7.0
        else:
            if years < 3:
                base_lpa = 6.0 + years * 1.5
            elif years < 6:
                base_lpa = 12.0 + (years - 2) * 2.0
            elif years < 10:
                base_lpa = 22.0 + (years - 5) * 3.5
            else:
                base_lpa = 42.0 + (years - 8) * 5.0

        role_multipliers = {
            "Software Engineer": 1.00,
            "Frontend Engineer": 0.95,
            "Backend Engineer": 1.05,
            "Full-Stack Engineer": 1.02,
            "Data Scientist": 1.10,
            "ML Engineer": 1.15,
            "DevOps Engineer": 0.98,
            "Product Manager": 1.10
        }
        role_mult = 1.0
        for r_title, mult in role_multipliers.items():
            if r_title.lower() in role.lower():
                role_mult = mult
                break

        location_multipliers = {
            "Bangalore": 1.00,
            "Bengaluru": 1.00,
            "Mumbai": 0.95,
            "Delhi": 0.92,
            "Gurugram": 0.92,
            "Noida": 0.88,
            "Hyderabad": 0.90,
            "Pune": 0.85,
            "Chennai": 0.82
        }
        loc_mult = 1.0
        for loc_name, mult in location_multipliers.items():
            if loc_name.lower() in location.lower():
                loc_mult = mult
                break

        lpa = base_lpa * role_mult * loc_mult
        lpa = max(3.5, min(lpa, 150.0))
        salary_median = int(lpa * 100000)
    else:
        if level == "entry":
            base_usd_k = 70.0 + min(years, 3) * 12.0
        elif level == "mid":
            base_usd_k = 110.0 + min(max(years - 2, 0), 5) * 12.0
        elif level == "senior":
            base_usd_k = 160.0 + min(max(years - 5, 0), 6) * 15.0
        elif level == "staff":
            base_usd_k = 230.0 + min(max(years - 8, 0), 8) * 20.0
        elif level == "principal":
            base_usd_k = 350.0 + min(max(years - 12, 0), 10) * 30.0
        else:
            if years < 3:
                base_usd_k = 70.0 + years * 12.0
            elif years < 6:
                base_usd_k = 110.0 + (years - 2) * 12.0
            elif years < 10:
                base_usd_k = 160.0 + (years - 5) * 15.0
            else:
                base_usd_k = 230.0 + (years - 8) * 20.0

        role_multipliers = {
            "Software Engineer": 1.00,
            "Frontend Engineer": 0.96,
            "Backend Engineer": 1.04,
            "Full-Stack Engineer": 1.02,
            "Data Scientist": 1.08,
            "ML Engineer": 1.14,
            "DevOps Engineer": 0.98,
            "Product Manager": 1.12
        }
        role_mult = 1.0
        for r_title, mult in role_multipliers.items():
            if r_title.lower() in role.lower():
                role_mult = mult
                break

        location_multipliers = {
            "San Francisco": 1.00,
            "New York": 0.96,
            "Seattle": 0.98,
            "Austin": 0.88,
            "Boston": 0.90,
            "Remote": 0.92
        }
        loc_mult = 1.0
        for loc_name, mult in location_multipliers.items():
            if loc_name.lower() in location.lower():
                loc_mult = mult
                break

        usd_k = base_usd_k * role_mult * loc_mult
        usd_k = max(45.0, min(usd_k, 750.0))
        salary_median = int(usd_k * 1000)

    salary_p25 = int(salary_median * 0.90)
    salary_p75 = int(salary_median * 1.10)

    bonus_val = salary_median * bonus_pct
    equity_val_annual = salary_median * equity_pct
    equity_val_4yr = equity_val_annual * 4

    tc_median = int(salary_median + bonus_val + equity_val_annual)
    tc_p25 = int(salary_p25 + (bonus_val * 0.90) + (equity_val_annual * 0.90))
    tc_p75 = int(salary_p75 + (bonus_val * 1.10) + (equity_val_annual * 1.10))

    negotiation_floor = int(salary_p25)
    negotiation_ceiling = int(salary_median * 1.20)

    def format_val(val):
        if currency == "INR":
            if val >= 10000000:
                return f"₹{val / 10000000:.2f} Cr"
            elif val >= 100000:
                return f"₹{val / 100000:.1f}L"
            else:
                return f"₹{val / 1000:.0f}K"
        else:
            return f"${val / 1000:.0f}K"

    equity_range_str = f"{format_val(equity_val_4yr * 0.8)}–{format_val(equity_val_4yr * 1.2)} ESOPs/RSUs over 4 years"
    signing_median = salary_median * (0.05 if level == "entry" else 0.10 if level == "mid" else 0.15)
    signing_bonus_str = f"{format_val(signing_median * 0.75)}–{format_val(signing_median * 1.25)} one-time"

    floor_str = format_val(negotiation_floor)
    ceiling_str = format_val(negotiation_ceiling)
    median_str = format_val(salary_median)
    script = (
        f"Based on recent compensation benchmarks for a {level.capitalize()}-level {role} in {location}, "
        f"the standard base salary typically ranges from {floor_str} to {ceiling_str}. "
        f"Given my technical expertise and track record, I am looking for a base salary closer to "
        f"{median_str}, along with standard performance variable pay and equity."
    )

    insights = [
        f"{location} remains a premier market for {role} talent, with salary bands experiencing steady YoY adjustments.",
        f"Variable pay at the {level.capitalize()} level typically forms about {int(bonus_pct * 100)}% of the total cash compensation.",
        "Equity options are increasingly used to attract talent, generally vesting linearly over 4 years with a 1-year cliff."
    ]

    return SalaryIntelligenceResponse(
        base_salary_band=CompensationBand(p25=salary_p25, median=salary_median, p75=salary_p75),
        total_comp_band=CompensationBand(p25=tc_p25, median=tc_median, p75=tc_p75),
        equity_range=equity_range_str,
        signing_bonus_range=signing_bonus_str,
        negotiation_floor=negotiation_floor,
        negotiation_ceiling=negotiation_ceiling,
        negotiation_script=script,
        market_insights=insights
    )

def predict(request: SalaryRequest) -> SalaryIntelligenceResponse:
    """Predict salary compensation using a custom trained deep learning regression model."""
    try:
        model = local_models.salary_model
        features = local_models.salary_features
    except Exception as e:
        logger.warning(f"Could not load local DL model: {e}. Falling back to deterministic model.")
        return predict_deterministic(request)

    role = request.role_title.strip()
    location = request.location.strip()
    level = request.experience_level.strip().lower()
    years = request.experience_years
    currency = getattr(request, "currency", "INR")
    if currency not in ("INR", "USD"):
        currency = "INR"

    # Map level to seniority categories present in training data: Junior, Mid, Senior, Lead
    mapped_seniority = "Mid"
    if "junior" in level or "entry" in level:
        mapped_seniority = "Junior"
    elif "senior" in level:
        mapped_seniority = "Senior"
    elif "lead" in level or "staff" in level or "principal" in level:
        mapped_seniority = "Lead"

    # Assemble input features dictionary matching the one-hot columns list
    features_dict = {"years_experience": float(years)}
    for col in features:
        if col == "years_experience":
            continue
        features_dict[col] = 0.0

    # Match role categories
    role_matched = False
    for col in features:
        if col.startswith("role_"):
            val = col.replace("role_", "").lower()
            if val in role.lower():
                features_dict[col] = 1.0
                role_matched = True

    if not role_matched and "role_Software Engineer" in features_dict:
        features_dict["role_Software Engineer"] = 1.0

    # Match location categories
    location_matched = False
    for col in features:
        if col.startswith("location_"):
            val = col.replace("location_", "").lower()
            if val in location.lower():
                features_dict[col] = 1.0
                location_matched = True

    if not location_matched and "location_Bangalore" in features_dict:
        features_dict["location_Bangalore"] = 1.0

    # Match seniority categories
    for col in features:
        if col.startswith("seniority_"):
            val = col.replace("seniority_", "").lower()
            if val == mapped_seniority.lower():
                features_dict[col] = 1.0

    # Order features matching saved layout
    input_vector = [features_dict[col] for col in features]
    input_arr = np.array([input_vector], dtype=np.float32)

    # Perform prediction in raw INR
    prediction = model.predict(input_arr)
    predicted_val_inr = float(prediction[0][0])
    
    # Clip extreme ranges to realistic tech bands
    predicted_val_inr = max(350000.0, min(predicted_val_inr, 15000000.0))

    # Apply currency conversion if USD is requested (e.g. 1 USD = 83 INR)
    if currency == "USD":
        predicted_val = predicted_val_inr / 83.0
    else:
        predicted_val = predicted_val_inr

    salary_median = int(predicted_val)
    salary_p25 = int(salary_median * 0.90)
    salary_p75 = int(salary_median * 1.10)

    # Derived bonus and equity percentages depending on level
    bonus_pct = 0.10
    if level == "mid":
        bonus_pct = 0.15
    elif level == "senior":
        bonus_pct = 0.20
    elif level in ("staff", "principal"):
        bonus_pct = 0.25

    equity_pct = 0.10
    if level == "mid":
        equity_pct = 0.20
    elif level == "senior":
        equity_pct = 0.35
    elif level == "staff":
        equity_pct = 0.50
    elif level == "principal":
        equity_pct = 0.70

    bonus_val = salary_median * bonus_pct
    equity_val_annual = salary_median * equity_pct
    equity_val_4yr = equity_val_annual * 4

    tc_median = int(salary_median + bonus_val + equity_val_annual)
    tc_p25 = int(salary_p25 + (bonus_val * 0.90) + (equity_val_annual * 0.90))
    tc_p75 = int(salary_p75 + (bonus_val * 1.10) + (equity_val_annual * 1.10))

    negotiation_floor = int(salary_p25)
    negotiation_ceiling = int(salary_median * 1.20)

    def format_val(val):
        if currency == "INR":
            if val >= 10000000:
                return f"₹{val / 10000000:.2f} Cr"
            elif val >= 100000:
                return f"₹{val / 100000:.1f}L"
            else:
                return f"₹{val / 1000:.0f}K"
        else:
            return f"${val / 1000:.0f}K"

    equity_range_str = f"{format_val(equity_val_4yr * 0.8)}–{format_val(equity_val_4yr * 1.2)} ESOPs/RSUs over 4 years"
    signing_median = salary_median * (0.05 if level == "entry" else 0.10 if level == "mid" else 0.15)
    signing_bonus_str = f"{format_val(signing_median * 0.75)}–{format_val(signing_median * 1.25)} one-time"

    floor_str = format_val(negotiation_floor)
    ceiling_str = format_val(negotiation_ceiling)
    median_str = format_val(salary_median)
    script = (
        f"Based on recent compensation benchmarks for a {level.capitalize()}-level {role} in {location}, "
        f"the standard base salary typically ranges from {floor_str} to {ceiling_str}. "
        f"Given my technical expertise and track record, I am looking for a base salary closer to "
        f"{median_str}, along with standard performance variable pay and equity."
    )

    insights = [
        f"{location} remains a premier market for {role} talent, with salary bands experiencing steady YoY adjustments.",
        f"Variable pay at the {level.capitalize()} level typically forms about {int(bonus_pct * 100)}% of the total cash compensation.",
        "Equity options are increasingly used to attract talent, generally vesting linearly over 4 years with a 1-year cliff."
    ]

    return SalaryIntelligenceResponse(
        base_salary_band=CompensationBand(p25=salary_p25, median=salary_median, p75=salary_p75),
        total_comp_band=CompensationBand(p25=tc_p25, median=tc_median, p75=tc_p75),
        equity_range=equity_range_str,
        signing_bonus_range=signing_bonus_str,
        negotiation_floor=negotiation_floor,
        negotiation_ceiling=negotiation_ceiling,
        negotiation_script=script,
        market_insights=insights
    )
