# backend/scripts/train_salary_dl_model.py
"""Train a simple TensorFlow model on the dummy Indian salary data.
Generates a regression model predicting salary based on role, location, seniority, and years of experience.
"""
import os
import json
import numpy as np
import pandas as pd
from tensorflow import keras
from tensorflow.keras import layers

DATA_PATH = os.path.abspath(os.path.join(__file__, "../../data/india_salary_raw.json"))
MODEL_PATH = os.path.abspath(os.path.join(__file__, "../../models/salary_india_dl_model.h5"))

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return pd.DataFrame(raw)

def preprocess(df):
    # One‑hot encode categorical columns
    df = pd.get_dummies(df, columns=["role", "location", "seniority"], drop_first=True)
    X = df.drop(columns=["salary"]).values
    y = df["salary"].values
    return X, y

def build_model(input_dim):
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(32, activation="relu"),
        layers.Dense(1)  # regression output
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    return model

def main():
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    df = pd.DataFrame(raw)
    X, y = preprocess(df)
    # Ensure numeric dtype for TensorFlow (float32)
    X = X.astype('float32')
    y = y.astype('float32')
    model = build_model(X.shape[1])
    model.fit(X, y, epochs=30, batch_size=16, validation_split=0.2, verbose=1)
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()
