import os
import sys
import logging

# Ensure backend root is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging to show loading process
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("test_local_models")

from app.ml_models import local_models
from app.dl_salary import predict
from app.schemas import SalaryRequest

def test_salary_model():
    logger.info("=== Testing Salary Intelligence Model ===")
    request = SalaryRequest(
        role_title="Software Engineer",
        location="Bangalore",
        experience_level="mid",
        experience_years=4,
        currency="INR"
    )
    try:
        response = predict(request)
        logger.info(f"Successfully ran salary prediction!")
        logger.info(f"Base Salary Band: {response.base_salary_band}")
        logger.info(f"Total Comp Band: {response.total_comp_band}")
        logger.info(f"Negotiation Script: {response.negotiation_script}")
    except Exception as e:
        logger.error(f"Salary model failed: {e}", exc_info=True)

def test_career_classifier():
    logger.info("=== Testing Career Compass Classifier ===")
    try:
        clf = local_models.career_classifier
        test_text = "Experienced building React, web apps, styles, vanilla CSS layouts and frontend javascript interfaces."
        prediction = clf.predict([test_text])[0]
        logger.info(f"Input: '{test_text}'")
        logger.info(f"Predicted Career: {prediction}")
    except Exception as e:
        logger.error(f"Career classifier failed: {e}", exc_info=True)

def test_ats_scorer():
    logger.info("=== Testing Local ATS Cross-Encoder Scorer ===")
    try:
        scorer = local_models.ats_scorer
        jd = "Looking for a Frontend Engineer with React and CSS styling experience."
        resume = "Resume details: React developer who styles responsive web apps with CSS."
        score = scorer.predict([(jd, resume)])[0]
        logger.info(f"JD: '{jd}'")
        logger.info(f"Resume: '{resume}'")
        logger.info(f"Cross-Encoder Match Score (raw): {score:.4f}")
    except Exception as e:
        logger.error(f"ATS scorer failed: {e}", exc_info=True)

def test_ner_pipeline():
    logger.info("=== Testing Local BERT NER Extractor ===")
    try:
        ner = local_models.ner_pipeline
        text = "Google is looking for a Software Engineer in Bangalore, India."
        entities = ner(text)
        logger.info(f"Input: '{text}'")
        logger.info(f"Entities extracted: {entities}")
    except Exception as e:
        logger.error(f"NER pipeline failed: {e}", exc_info=True)

def test_local_llm():
    logger.info("=== Testing Local Generative LLM (Qwen) ===")
    try:
        # Avoid full pipeline loading if user wants to run quickly without massive model download,
        # but let's try calling it.
        system_prompt = "You are a helpful assistant. Keep your response under 10 words."
        user_input = "Say hello!"
        logger.info("Invoking local Qwen model...")
        response = local_models.call_local_llm(system_prompt=system_prompt, user_input=user_input)
        logger.info(f"Qwen response: '{response}'")
    except Exception as e:
        logger.error(f"Local LLM call failed: {e}", exc_info=True)

def main():
    logger.info(f"LocalModelRegistry configured device: {local_models.device}")
    
    # Run tests
    test_salary_model()
    test_career_classifier()
    
    print("\nNote: Running the next tests (ATS Scorer, NER, and Local LLM) will automatically download ")
    print("the required models from Hugging Face if they are not already cached. This can take several minutes.")
    
    ans = input("Do you want to run the Hugging Face model tests? (y/N): ").strip().lower()
    if ans == 'y':
        test_ats_scorer()
        test_ner_pipeline()
        test_local_llm()
    else:
        logger.info("Skipping Hugging Face models test.")

if __name__ == "__main__":
    main()
