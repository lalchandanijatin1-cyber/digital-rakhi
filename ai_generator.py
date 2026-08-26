"""
ai_generator.py

Handles AI image generation for the Digital Rakhi project using the
Hugging Face Inference API.

Flow:

    Flask /generate
        -> generate_image(prompt)
        -> prompt.build_prompt()          (adds Rakhi style suffix)
        -> Hugging Face InferenceClient
        -> black-forest-labs/FLUX.1-schnell
        -> PIL.Image
        -> saved as PNG under static/generated/
        -> "/static/generated/<file>.png" returned to Flask

No Flask routes live in this file. No Pollinations code lives here.
"""

import logging
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from huggingface_hub import InferenceClient

from prompt import build_prompt


# --------------------------------------------------------------------------
# ENVIRONMENT
# --------------------------------------------------------------------------

load_dotenv()

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------
# CONFIGURATION
# --------------------------------------------------------------------------

HF_TOKEN_ENV_VAR = "HF_TOKEN"

HF_MODEL = "black-forest-labs/FLUX.1-schnell"

IMAGE_FORMAT = "png"

# ai/backend/ -> static/generated/
BACKEND_DIR = Path(__file__).resolve().parent
STATIC_DIR = BACKEND_DIR / "static"
GENERATED_DIR = STATIC_DIR / "generated"


# --------------------------------------------------------------------------
# CUSTOM ERROR
# --------------------------------------------------------------------------

class ImageGenerationError(Exception):
    """
    Raised whenever image generation cannot be completed, for any reason
    (missing token, auth failure, provider error, save failure, etc).
    """
    pass


# --------------------------------------------------------------------------
# HUGGING FACE CLIENT (lazy singleton)
# --------------------------------------------------------------------------

_client = None


def _get_hf_token() -> str:
    """
    Read HF_TOKEN from the environment. Never logs or returns it anywhere
    except as the raw string used to build the client.
    """

    token = os.getenv(HF_TOKEN_ENV_VAR)

    if not token:
        raise ImageGenerationError(
            "Hugging Face token is not configured. "
            "Add HF_TOKEN to your .env file."
        )

    return token.strip()


def _get_client() -> InferenceClient:
    """
    Build (once) and return the shared InferenceClient.
    """

    global _client

    if _client is not None:
        return _client

    token = _get_hf_token()

    try:
        _client = InferenceClient(
            provider="auto",
            api_key=token,
        )
    except Exception as error:
        logger.error(f"Failed to initialize Hugging Face client: {error}")
        raise ImageGenerationError(
            "Could not initialize the Hugging Face client."
        ) from error

    return _client


# --------------------------------------------------------------------------
# REQUEST IMAGE FROM HUGGING FACE
# --------------------------------------------------------------------------

def _request_image_from_provider(final_prompt: str):
    """
    Send the prompt to FLUX.1-schnell via Hugging Face and return a
    PIL.Image.Image.
    """

    client = _get_client()

    logger.info("Sending image-generation request to Hugging Face.")
    logger.info(f"Model: {HF_MODEL}")

    try:
        image = client.text_to_image(
            final_prompt,
            model=HF_MODEL,
        )

    except Exception as error:
        error_text = str(error)
        lowered = error_text.lower()

        # ----------------------------------------------------------
        # AUTHENTICATION ERROR
        # ----------------------------------------------------------
        if "401" in error_text or "unauthorized" in lowered:
            logger.error("Hugging Face authentication failed.")
            raise ImageGenerationError(
                "Hugging Face authentication failed. "
                "Check that HF_TOKEN is valid and has "
                "'Make calls to Inference Providers' permission."
            ) from error

        # ----------------------------------------------------------
        # BILLING / INSUFFICIENT CREDITS
        # ----------------------------------------------------------
        if "402" in error_text or "payment" in lowered or "credit" in lowered or "balance" in lowered:
            logger.error(f"Hugging Face billing error: {error_text[:500]}")
            raise ImageGenerationError(
                "Hugging Face rejected the request due to insufficient "
                "credits/balance for this model or provider."
            ) from error

        # ----------------------------------------------------------
        # RATE LIMIT
        # ----------------------------------------------------------
        if "429" in error_text or "rate limit" in lowered:
            logger.error("Hugging Face rate limit reached.")
            raise ImageGenerationError(
                "Hugging Face rate limit reached. Please try again shortly."
            ) from error

        # ----------------------------------------------------------
        # MODEL / PROVIDER NOT AVAILABLE
        # ----------------------------------------------------------
        if "503" in error_text or "loading" in lowered:
            logger.error(f"Hugging Face model unavailable: {error_text[:500]}")
            raise ImageGenerationError(
                "The image model is currently loading or unavailable on "
                "Hugging Face. Please try again in a moment."
            ) from error

        # ----------------------------------------------------------
        # ANY OTHER ERROR
        # ----------------------------------------------------------
        logger.error(f"Hugging Face image generation failed: {error_text[:500]}")
        raise ImageGenerationError(
            f"Hugging Face image generation failed: {error_text[:300]}"
        ) from error

    if image is None:
        raise ImageGenerationError(
            "Hugging Face returned no image data."
        )

    logger.info("Hugging Face image generated successfully.")

    return image


# --------------------------------------------------------------------------
# SAVE IMAGE
# --------------------------------------------------------------------------

def _save_generated_image(image) -> str:
    """
    Save a PIL.Image.Image into static/generated/ with a safe unique
    filename, without overwriting anything already there.

    Returns:
        The URL path Flask should hand back to the frontend, e.g.
        "/static/generated/rakhi_<uuid>.png"
    """

    try:
        GENERATED_DIR.mkdir(parents=True, exist_ok=True)

        filename = f"rakhi_{uuid.uuid4().hex}.{IMAGE_FORMAT}"
        file_path = GENERATED_DIR / filename

        image.save(file_path, format="PNG")

        logger.info(f"Generated image saved: {file_path}")

        return f"/static/generated/{filename}"

    except OSError as error:
        logger.error(f"Failed to save generated image: {error}")
        raise ImageGenerationError(
            "Could not save the generated image."
        ) from error


# --------------------------------------------------------------------------
# PUBLIC FUNCTION
# --------------------------------------------------------------------------

def generate_image(prompt: str) -> str:
    """
    Generate a Rakhi image using Hugging Face FLUX.1-schnell.

    Args:
        prompt: User's Rakhi description (already stripped/validated by
            the caller, but re-checked here defensively).

    Returns:
        URL path of the generated image, e.g. "/static/generated/x.png".

    Raises:
        ValueError: if the prompt is empty.
        ImageGenerationError: for any provider/config/save failure.
    """

    if not prompt or not prompt.strip():
        raise ValueError("Prompt must not be empty.")

    prompt = prompt.strip()

    final_prompt = build_prompt(prompt)

    logger.info("Starting Rakhi image generation.")

    image = _request_image_from_provider(final_prompt)

    image_url = _save_generated_image(image)

    logger.info("Rakhi image generation completed.")

    return image_url