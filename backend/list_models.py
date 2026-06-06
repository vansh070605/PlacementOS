from google import genai
import sys
import os

# Add parent directory to sys.path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.config import settings

def main():
    print("API Key:", settings.gemini_api_key)
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        print("Querying models...")
        for model in client.models.list():
            print(f"Name: {model.name}, Display Name: {model.display_name}, Supported Methods: {model.supported_actions}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
