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
    # One‑hot encode categorical columns without dropping first
    df = pd.get_dummies(df, columns=["role", "location", "seniority"], drop_first=False)
    X = df.drop(columns=["salary"])
    y = df["salary"].values
    return X, y

def build_model(input_dim):
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.15),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.1),
        layers.Dense(32, activation="relu"),
        layers.Dense(1)  # regression output
    ])
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.002), loss="mse", metrics=["mae"])
    return model

def main():
    models_dir = os.path.dirname(MODEL_PATH)
    os.makedirs(models_dir, exist_ok=True)
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    df = pd.DataFrame(raw)
    X_df, y = preprocess(df)
    
    # Save feature columns layout
    feature_columns = list(X_df.columns)
    features_json_path = os.path.join(models_dir, "salary_features.json")
    with open(features_json_path, "w", encoding="utf-8") as f:
        json.dump(feature_columns, f, indent=4)
    print(f"Saved feature list to {features_json_path}")
    
    # Ensure numeric dtype for TensorFlow (float32)
    X = X_df.values.astype('float32')
    y = y.astype('float32')
    model = build_model(X.shape[1])
    model.fit(X, y, epochs=50, batch_size=16, validation_split=0.2, verbose=1)
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()

