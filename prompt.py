"""
prompt.py

Builds the final text-to-image prompt sent to the AI provider.

The frontend may send a specific, fully-formed prompt, either typed by the
user or selected from an example. This module preserves that prompt and
adds a consistent Rakhi-specific style suffix.

This keeps ai_generator.py focused only on communicating with Hugging Face.
"""

# --------------------------------------------------------------------------
# RAKHI STYLE
# --------------------------------------------------------------------------

RAKHI_STYLE_SUFFIX = (
    "traditional Indian Rakhi, festive colors, magenta, hot pink, ruby red, "
    "purple, bright saffron, metallic gold, decorative beads, gemstones, "
    "intricate circular centerpiece, elegant Rakhi threads, traditional "
    "Indian craftsmanship, highly detailed, professional product photography, "
    "centered composition, symmetrical, square 1:1 image, clean simple "
    "background, festive elegant lighting, no text, no letters, no watermark, "
    "no logo, no people, no hands, no faces"
)


# --------------------------------------------------------------------------
# BUILD FINAL PROMPT
# --------------------------------------------------------------------------

def build_prompt(user_prompt: str) -> str:
    """
    Combine the user's prompt with the consistent Rakhi style suffix.

    Args:
        user_prompt: Prompt received from the frontend.

    Returns:
        Final prompt that will be sent to the Hugging Face image model.

    Raises:
        ValueError: If the prompt is empty.
    """

    cleaned = (user_prompt or "").strip()

    if not cleaned:
        raise ValueError("Prompt must not be empty.")

    return f"{cleaned}, {RAKHI_STYLE_SUFFIX}"