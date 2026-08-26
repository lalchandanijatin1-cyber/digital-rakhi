import os

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from ai_generator import generate_image, ImageGenerationError


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
GENERATED_DIR = os.path.join(BASE_DIR, "generated")

os.makedirs(GENERATED_DIR, exist_ok=True)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)


# ============================================================
# FRONTEND
# ============================================================

@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def frontend_files(filename):
    """
    Serve files from the frontend folder.

    Examples:
        /css/style.css
        /js/script.js
        /images/logo.png
    """

    return send_from_directory(FRONTEND_DIR, filename)


# ============================================================
# GENERATED IMAGES
# ============================================================

@app.route("/generated/<path:filename>")
def generated_files(filename):
    return send_from_directory(GENERATED_DIR, filename)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health_check():

    return jsonify({
        "success": True,
        "message": "Rakhi AI backend is running."
    })


# ============================================================
# AI IMAGE GENERATION
# ============================================================

@app.route("/generate", methods=["POST"])
def generate():

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "success": False,
            "error": "Request body must be valid JSON."
        }), 400

    raw_prompt = data.get("prompt", "")

    if not isinstance(raw_prompt, str):
        return jsonify({
            "success": False,
            "error": "Prompt must be a string."
        }), 400

    prompt = raw_prompt.strip()

    if not prompt:
        return jsonify({
            "success": False,
            "error": "Prompt is required."
        }), 400

    try:

        image_url = generate_image(prompt)

        return jsonify({
            "success": True,
            "image_url": image_url
        }), 200

    except ValueError as error:

        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except ImageGenerationError as error:

        app.logger.error(
            f"Image generation failed: {error}"
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 502

    except Exception as error:

        app.logger.exception(
            f"Unexpected server error: {error}"
        )

        return jsonify({
            "success": False,
            "error": "An unexpected server error occurred."
        }), 500


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "error": "The requested endpoint does not exist."
    }), 404


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    print()
    print("=" * 50)
    print("DIGITAL RAKHI")
    print("=" * 50)
    print(f"Website: http://{host}:{port}/")
    print(f"Health:  http://{host}:{port}/health")
    print("=" * 50)
    print()

    app.run(
        host=host,
        port=port,
        debug=debug_mode
    )