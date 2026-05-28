# backend/scripts/fetch_india_salary_data.py
"""Fetch Indian salary data from public sources (Glassdoor, PayScale, LinkedIn Salary).
This script is a placeholder – in a real deployment you would need API keys or scraping logic.
It writes a JSON file with a list of salary records.
"""
import json
import os
import random

def generate_dummy_data(num_records: int = 200):
    roles = ["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer"]
    locations = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"]
    seniorities = ["Junior", "Mid", "Senior", "Lead"]
    data = []
    for _ in range(num_records):
        record = {
            "role": random.choice(roles),
            "location": random.choice(locations),
            "seniority": random.choice(seniorities),
            "years_experience": random.randint(0, 10),
            "salary": random.randint(300000, 3000000)  # INR per annum
        }
        data.append(record)
    return data

def main():
    os.makedirs(os.path.abspath(os.path.join(__file__, "../../data")), exist_ok=True)
    output_path = os.path.abspath(os.path.join(__file__, "../../data/india_salary_raw.json"))
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(generate_dummy_data(), f, indent=2)
    print(f"Dummy Indian salary data written to {output_path}")

if __name__ == "__main__":
    main()
