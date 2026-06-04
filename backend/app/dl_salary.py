import os
from .schemas import SalaryRequest, SalaryIntelligenceResponse, CompensationBand

def predict(request: SalaryRequest) -> SalaryIntelligenceResponse:
    """Predict salary compensation using a calibrated, deterministic market model.
    Supports both INR (Indian Rupees / LPA) and USD ($) options.
    """
    role = request.role_title.strip()
    location = request.location.strip()
    level = request.experience_level.strip().lower()
    years = request.experience_years
    currency = getattr(request, "currency", "INR")
    if currency not in ("INR", "USD"):
        currency = "INR"

    # Define experience level parameters
    # Entry: 10% bonus, Mid: 15% bonus, Senior: 20% bonus, Staff/Principal: 25% bonus
    bonus_pct = 0.10
    if level == "mid":
        bonus_pct = 0.15
    elif level == "senior":
        bonus_pct = 0.20
    elif level in ("staff", "principal"):
        bonus_pct = 0.25

    # Annualized equity parameters (ESOPs / RSUs % of base salary)
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
        # ── Indian Rupees Calibration (in LPA - Lakhs Per Annum) ──
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

        def format_inr_str(val):
            if val >= 10000000:
                return f"₹{val / 10000000:.2f} Cr"
            elif val >= 100000:
                return f"₹{val / 100000:.1f}L"
            else:
                return f"₹{val / 1000:.0f}K"

        equity_range_str = f"{format_inr_str(equity_val_4yr * 0.8)}–{format_inr_str(equity_val_4yr * 1.2)} ESOPs/RSUs over 4 years"
        
        signing_median = salary_median * (0.05 if level == "entry" else 0.10 if level == "mid" else 0.15)
        signing_bonus_str = f"{format_inr_str(signing_median * 0.75)}–{format_inr_str(signing_median * 1.25)} one-time"

        floor_lpa_str = f"{negotiation_floor / 100000:.1f}"
        ceiling_lpa_str = f"{negotiation_ceiling / 100000:.1f}"
        script = (
            f"Based on recent compensation benchmarks for a {level.capitalize()}-level {role} in {location}, "
            f"the standard base salary typically ranges from {floor_lpa_str} LPA to {ceiling_lpa_str} LPA. "
            f"Given my technical expertise and track record, I am looking for a base salary closer to "
            f"{salary_median / 100000:.1f} LPA, along with standard performance variable pay and equity."
        )

        insights = [
            f"{location} remains a premier market for {role} talent, with salary bands experiencing steady YoY adjustments.",
            f"Variable pay at the {level.capitalize()} level typically forms about {int(bonus_pct * 100)}% of the total cash compensation in standard Indian tech firms.",
            "Equity options (ESOPs/RSUs) are increasingly used to attract talent, generally vesting linearly over 4 years with a 1-year cliff.",
            "Remember to evaluate the in-hand component, taking into account employer PF contributions (12% of basic) and Gratuity benefits."
        ]

    else:
        # ── US Dollars Calibration (in thousands - $K/yr) ──
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

        def format_usd_str(val):
            return f"${val / 1000:.0f}K"

        equity_range_str = f"{format_usd_str(equity_val_4yr * 0.8)}–{format_usd_str(equity_val_4yr * 1.2)} RSUs over 4 years"
        
        signing_median = salary_median * (0.05 if level == "entry" else 0.10 if level == "mid" else 0.15)
        signing_bonus_str = f"{format_usd_str(signing_median * 0.75)}–{format_usd_str(signing_median * 1.25)} one-time"

        floor_usd_str = f"${negotiation_floor / 1000:.0f}K"
        ceiling_usd_str = f"${negotiation_ceiling / 1000:.0f}K"
        script = (
            f"Based on recent compensation benchmarks for a {level.capitalize()}-level {role} in {location}, "
            f"the standard base salary typically ranges from {floor_usd_str} to {ceiling_usd_str}. "
            f"Given my technical expertise and track record, I am looking for a base salary closer to "
            f"${salary_median / 1000:.0f}K, along with standard performance bonus and equity."
        )

        insights = [
            f"{location} remains a premier market for {role} talent, with salary bands experiencing steady YoY adjustments.",
            f"Variable bonus at the {level.capitalize()} level typically forms about {int(bonus_pct * 100)}% of the total cash compensation in standard tech firms.",
            "Equity grants (RSUs/options) are standard in major tech hubs, typically following a 4-year vesting schedule with a 1-year cliff.",
            "Always factor in cost-of-living adjustments, state taxes, and 401(k) employer matching when evaluating cash compensation."
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
