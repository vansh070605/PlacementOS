import logging
from typing import List
from google import genai
from .config import settings

logger = logging.getLogger("placementos.key_manager")

class KeyRotationManager:
    """
    Manages pools of Gemini and Groq API keys and corresponding client instances.
    Provides automatic round-robin style rotation when rate limits are hit.
    """
    def __init__(self):
        # Gemini setup
        self.keys = settings.api_keys_list
        self._clients = [genai.Client(api_key=key) for key in self.keys]
        self._current_index = 0
        
        # Groq setup
        self.groq_keys = settings.groq_keys_list
        self._groq_index = 0
        
        logger.info(
            f"KeyRotationManager initialized with {len(self.keys)} Gemini API key(s) "
            f"and {len(self.groq_keys)} Groq API key(s)."
        )

    @property
    def has_keys(self) -> bool:
        return len(self.keys) > 0

    @property
    def has_groq_keys(self) -> bool:
        return len(self.groq_keys) > 0

    def get_current_client(self) -> genai.Client:
        if not self._clients:
            # Fallback if settings are not fully loaded yet
            keys = settings.api_keys_list
            if keys:
                self.keys = keys
                self._clients = [genai.Client(api_key=key) for key in self.keys]
            else:
                raise ValueError(
                    "GEMINI_API_KEY or GEMINI_API_KEYS is missing from backend/.env! "
                    "Please configure at least one API key."
                )
        return self._clients[self._current_index]

    def get_current_key(self) -> str:
        if not self.keys:
            return "unknown"
        return self.keys[self._current_index]

    def rotate_key(self):
        if len(self.keys) <= 1:
            logger.warning("Only 1 Gemini API key configured. Cannot rotate key pool.")
            return
        self._current_index = (self._current_index + 1) % len(self.keys)
        logger.info(
            f"Rotating Gemini API Key. Switched to key index {self._current_index} "
            f"(suffix: ...{self.get_current_key()[-6:]})"
        )

    # ── Groq Rotation & Invocations ───────────────────────────────────────────

    def get_current_groq_key(self) -> str:
        if not self.groq_keys:
            self.groq_keys = settings.groq_keys_list
            if not self.groq_keys:
                raise ValueError("No GROQ_API_KEY or GROQ_API_KEYS configured in backend/.env!")
        return self.groq_keys[self._groq_index]

    def rotate_groq_key(self):
        if len(self.groq_keys) <= 1:
            logger.warning("Only 1 Groq API key configured. Cannot rotate key pool.")
            return
        self._groq_index = (self._groq_index + 1) % len(self.groq_keys)
        logger.info(f"Rotating Groq API Key. Switched to key index {self._groq_index}")

    async def call_groq_completion(self, system_prompt: str, user_input: str, temperature: float = 0.2) -> str:
        """
        Invokes Groq API chat completions with key rotation and rate limit handling.
        """
        import httpx
        import asyncio

        # Pre-populate keys if needed
        if not self.groq_keys:
            self.groq_keys = settings.groq_keys_list

        retries = max(len(self.groq_keys) * 2, 5)
        delay = 2.0

        for attempt in range(retries):
            key = self.get_current_groq_key()
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": settings.groq_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                "temperature": temperature
            }
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=data,
                        timeout=30.0
                    )
                    response.raise_for_status()
                    res_json = response.json()
                    return res_json["choices"][0]["message"]["content"]
            except Exception as e:
                is_rate_limit = False
                if hasattr(e, "response") and getattr(e, "response") is not None:
                    status_code = getattr(e.response, "status_code", None)
                    if status_code in (429, 503):
                        is_rate_limit = True
                elif "429" in str(e) or "503" in str(e) or "resource_exhausted" in str(e).lower():
                    is_rate_limit = True

                if is_rate_limit:
                    logger.warning(
                        f"Groq API rate limit hit. Rotating Groq key pool... "
                        f"(Attempt {attempt+1}/{retries})"
                    )
                    self.rotate_groq_key()
                    if attempt < retries - 1:
                        await asyncio.sleep(delay)
                        delay *= 1.5
                    continue
                else:
                    raise e

# Global singleton rotation manager
key_manager = KeyRotationManager()
