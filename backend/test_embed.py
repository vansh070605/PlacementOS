import asyncio
import sys
import os

# Add parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agents import orchestrator
from app.config import settings

async def main():
    print("Gemini API Key:", settings.gemini_api_key)
    print("Gemini Model:", settings.gemini_model)
    try:
        jd = "We are seeking a Frontend Engineer with React 19, Vite, and Three.js expertise."
        print("Running analyze_jd...")
        res = await orchestrator.analyze_jd(jd)
        print("Analysis completed successfully!")
        print(res)
    except Exception as e:
        import traceback
        print("Caught exception:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
