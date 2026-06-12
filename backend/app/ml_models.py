import os
import json
import pickle
import logging
import torch
from typing import Optional, List, Dict, Any

# Configure logging
logger = logging.getLogger("placementos.ml_models")

class LocalModelRegistry:
    """
    Centralized loader and registry for local Machine Learning and Deep Learning models.
    All models are loaded lazily to preserve memory on startup and automatically
    routed to CUDA GPU if available.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(LocalModelRegistry, cls).__new__(cls, *args, **kwargs)
            cls._instance._init_registry()
        return cls._instance

    def _init_registry(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Local ML/DL models will run on device: {self.device}")

        # Model cache attributes
        self._salary_model = None
        self._salary_features = None
        self._career_classifier = None
        self._ats_scorer = None
        self._ner_pipeline = None
        self._generative_pipeline = None
        self._embedding_model = None

        # Base directories
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.models_dir = os.path.join(self.base_dir, "models")
        
        # Ensure models dir exists
        os.makedirs(self.models_dir, exist_ok=True)

    # ── 1. Salary Intelligence Regression MLP ──────────────────────────────
    @property
    def salary_model(self):
        if self._salary_model is None:
            model_path = os.path.join(self.models_dir, "salary_india_dl_model.h5")
            if not os.path.exists(model_path):
                # If model is not trained yet, we will raise an error prompting training
                raise FileNotFoundError(
                    f"Keras salary model not found at {model_path}. "
                    "Please run the salary_intelligence_mlp.ipynb notebook or train script first."
                )
            from tensorflow import keras
            logger.info("Loading local Keras Salary Regression Model...")
            self._salary_model = keras.models.load_model(model_path, compile=False)
            logger.info("Keras Salary Regression Model loaded successfully.")
        return self._salary_model

    @property
    def salary_features(self) -> List[str]:
        if self._salary_features is None:
            features_path = os.path.join(self.models_dir, "salary_features.json")
            if not os.path.exists(features_path):
                raise FileNotFoundError(f"Feature schema not found at {features_path}.")
            with open(features_path, "r") as f:
                self._salary_features = json.load(f)
        return self._salary_features

    # ── 2. Career Compass Classifier ──────────────────────────────────────────
    @property
    def career_classifier(self):
        if self._career_classifier is None:
            model_path = os.path.join(self.models_dir, "career_compass_classifier.pkl")
            if not os.path.exists(model_path):
                # Generate a fallback trained pipeline to ensure zero setup crash
                logger.warning("Local career classifier pkl not found. Generating dummy classifier...")
                self._generate_fallback_career_classifier(model_path)
            
            logger.info("Loading Career Compass Classifier pipeline...")
            with open(model_path, "rb") as f:
                self._career_classifier = pickle.load(f)
            logger.info("Career Compass Classifier loaded successfully.")
        return self._career_classifier

    def _generate_fallback_career_classifier(self, target_path):
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.pipeline import Pipeline
        resumes = [
            {"text": "React webpack design css html frontend three.js", "label": "Frontend Engineer"},
            {"text": "Python fastapi redis microservice postgreSQL sql", "label": "Backend Engineer"},
            {"text": "Pytorch pandas numpy data ml classification regression", "label": "Data Scientist"},
            {"text": "Docker kubernetes aws terraform prometheus vpc venv", "label": "DevOps Engineer"}
        ]
        X = [r["text"] for r in resumes]
        y = [r["label"] for r in resumes]
        pipe = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=100)),
            ('classifier', RandomForestClassifier(n_estimators=5, random_state=42))
        ])
        pipe.fit(X, y)
        with open(target_path, "wb") as f:
            pickle.dump(pipe, f)

    # ── 3. ATS Scorer Cross-Encoder ───────────────────────────────────────────
    @property
    def ats_scorer(self):
        if self._ats_scorer is None:
            from sentence_transformers import CrossEncoder
            model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
            logger.info(f"Loading Cross-Encoder model '{model_name}' on {self.device}...")
            self._ats_scorer = CrossEncoder(model_name, device=self.device)
            logger.info("Cross-Encoder model loaded successfully.")
        return self._ats_scorer

    # ── 4. JD Extractor NER Model ─────────────────────────────────────────────
    @property
    def ner_pipeline(self):
        if self._ner_pipeline is None:
            from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
            model_name = "dslim/bert-base-NER"
            logger.info(f"Loading BERT NER Tokenizer and Model on {self.device}...")
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForTokenClassification.from_pretrained(model_name)
            self._ner_pipeline = pipeline(
                "ner",
                model=model,
                tokenizer=tokenizer,
                aggregation_strategy="simple",
                device=0 if self.device == "cuda" else -1
            )
            logger.info("BERT NER pipeline ready.")
        return self._ner_pipeline

    # ── 5. Unified Local Generative LLM ───────────────────────────────────────
    @property
    def generative_pipeline(self):
        if self._generative_pipeline is None:
            from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
            # Using a highly-optimized, small, instruction-tuned local LLM
            model_id = "Qwen/Qwen2.5-1.5B-Instruct"
            logger.info(f"Loading local Causal LLM '{model_id}' on {self.device}...")
            
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch.float32,
                device_map="auto"
            )
            self._generative_pipeline = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                max_new_tokens=500
            )
            logger.info("Local Generative Causal LLM pipeline ready.")
        return self._generative_pipeline

    def call_local_llm(self, system_prompt: str, user_input: str, temperature: float = 0.2) -> str:
        """Helper to invoke local generative LLM with standardized prompt wrappers."""
        try:
            pipe = self.generative_pipeline
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ]
            prompt = pipe.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            # Generate response
            outputs = pipe(
                prompt,
                max_new_tokens=400,
                temperature=temperature,
                do_sample=True if temperature > 0.1 else False
            )
            generated_text = outputs[0]["generated_text"]
            # Extract assistant's reply
            if prompt in generated_text:
                return generated_text.replace(prompt, "").strip()
            return generated_text.strip()
        except Exception as e:
            logger.error(f"Local LLM call failed: {e}", exc_info=True)
            raise RuntimeError(f"Local LLM error: {e}")

# Global singleton loader instance
local_models = LocalModelRegistry()
