import os
import base64
import uuid
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from ai_generator import generate_image, ImageGenerationError


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Frontend
FRONTEND_DIR = os.path.join(
    BASE_DIR,
    "frontend"
)

# AI-generated images
GENERATED_DIR = os.path.join(
    BASE_DIR,
    "generated"
)

# Saved user designs
STORAGE_DIR = os.path.join(
    BASE_DIR,
    "storage"
)

DESIGNS_DIR = os.path.join(
    STORAGE_DIR,
    "designs"
)


# Create folders automatically
os.makedirs(
    GENERATED_DIR,
    exist_ok=True
)

os.makedirs(
    DESIGNS_DIR,
    exist_ok=True
)


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

    return send_from_directory(
        FRONTEND_DIR,
        "index.html"
    )


@app.route("/<path:filename>")
def frontend_files(filename):

    """
    Serve files from the frontend folder.

    Examples:

        /css/style.css
        /js/script.js
        /images/logo.png
    """

    return send_from_directory(
        FRONTEND_DIR,
        filename
    )


# ============================================================
# GENERATED AI IMAGES
# ============================================================

@app.route("/generated/<path:filename>")
def generated_files(filename):

    return send_from_directory(
        GENERATED_DIR,
        filename
    )


# ============================================================
# SAVED RAKHI DESIGNS
# ============================================================

@app.route("/storage/designs/<path:filename>")
def saved_design_files(filename):

    """
    Serve saved Rakhi designs.

    Example:

        /storage/designs/rakhi-123.png
    """

    return send_from_directory(
        DESIGNS_DIR,
        filename
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health_check():

    return jsonify({

        "success": True,

        "message":
            "Rakhi AI backend is running."

    })


# ============================================================
# AI IMAGE GENERATION
# ============================================================

@app.route("/generate", methods=["POST"])
def generate():

    data = request.get_json(
        silent=True
    )


    if data is None:

        return jsonify({

            "success": False,

            "error":
                "Request body must be valid JSON."

        }), 400


    # --------------------------------------------------------
    # GET PROMPT
    # --------------------------------------------------------

    raw_prompt = data.get(
        "prompt",
        ""
    )


    if not isinstance(
        raw_prompt,
        str
    ):

        return jsonify({

            "success": False,

            "error":
                "Prompt must be a string."

        }), 400


    prompt = raw_prompt.strip()


    if not prompt:

        return jsonify({

            "success": False,

            "error":
                "Prompt is required."

        }), 400


    # --------------------------------------------------------
    # GENERATE IMAGE
    # --------------------------------------------------------

    try:

        image_url = generate_image(
            prompt
        )


        return jsonify({

            "success": True,

            "image_url":
                image_url

        }), 200


    except ValueError as error:

        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 400


    except ImageGenerationError as error:

        app.logger.error(
            f"Image generation failed: {error}"
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 502


    except Exception as error:

        app.logger.exception(
            f"Unexpected server error: {error}"
        )


        return jsonify({

            "success": False,

            "error":
                "An unexpected server error occurred."

        }), 500


# ============================================================
# SAVE RAKHI DESIGN
# ============================================================

@app.route(
    "/api/designs",
    methods=["POST"]
)
def save_design():

    """
    Save a Rakhi design sent from the frontend.

    Expected JSON:

    {
        "name": "My Rakhi",
        "image": "data:image/png;base64,...",
        "source": "canvas"
    }

    OR:

    {
        "name": "AI Rakhi",
        "image": "data:image/png;base64,...",
        "source": "ai"
    }
    """

    try:

        # ----------------------------------------------------
        # READ REQUEST
        # ----------------------------------------------------

        data = request.get_json(
            silent=True
        )


        if data is None:

            return jsonify({

                "success": False,

                "error":
                    "Request body must be valid JSON."

            }), 400


        # ----------------------------------------------------
        # GET NAME
        # ----------------------------------------------------

        name = data.get(
            "name",
            "My Rakhi"
        )


        if not isinstance(
            name,
            str
        ):

            name = "My Rakhi"


        name = name.strip()


        if not name:

            name = "My Rakhi"


        # ----------------------------------------------------
        # GET IMAGE
        # ----------------------------------------------------

        image_data = data.get(
            "image"
        )


        if not image_data:

            return jsonify({

                "success": False,

                "error":
                    "Design image is required."

            }), 400


        if not isinstance(
            image_data,
            str
        ):

            return jsonify({

                "success": False,

                "error":
                    "Design image must be a string."

            }), 400


        # ----------------------------------------------------
        # CHECK IMAGE FORMAT
        # ----------------------------------------------------

        if image_data.startswith(
            "data:image/png;base64,"
        ):

            base64_data = image_data.split(
                ",",
                1
            )[1]

            extension = "png"


        elif image_data.startswith(
            "data:image/jpeg;base64,"
        ):

            base64_data = image_data.split(
                ",",
                1
            )[1]

            extension = "jpg"


        elif image_data.startswith(
            "data:image/jpg;base64,"
        ):

            base64_data = image_data.split(
                ",",
                1
            )[1]

            extension = "jpg"


        else:

            return jsonify({

                "success": False,

                "error":
                    "Only PNG and JPEG images are supported."

            }), 400


        # ----------------------------------------------------
        # DECODE IMAGE
        # ----------------------------------------------------

        try:

            image_bytes = base64.b64decode(
                base64_data
            )

        except Exception:

            return jsonify({

                "success": False,

                "error":
                    "Invalid image data."

            }), 400


        if not image_bytes:

            return jsonify({

                "success": False,

                "error":
                    "Image is empty."

            }), 400


        # ----------------------------------------------------
        # GENERATE UNIQUE ID
        # ----------------------------------------------------

        design_id = str(
            uuid.uuid4()
        )


        filename = (
            f"rakhi-{design_id}.{extension}"
        )


        filepath = os.path.join(
            DESIGNS_DIR,
            filename
        )


        # ----------------------------------------------------
        # SAVE IMAGE
        # ----------------------------------------------------

        with open(
            filepath,
            "wb"
        ) as image_file:

            image_file.write(
                image_bytes
            )


        # ----------------------------------------------------
        # SOURCE
        # ----------------------------------------------------

        source = data.get(
            "source",
            "canvas"
        )


        if source not in [
            "canvas",
            "ai"
        ]:

            source = "canvas"


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        design = {

            "id":
                design_id,

            "name":
                name,

            "filename":
                filename,

            "source":
                source,

            "created_at":
                datetime.now().isoformat(),

            "image_url":
                f"/storage/designs/{filename}"
        }


        print(
            f"Design saved: {filename}"
        )


        return jsonify({

            "success": True,

            "message":
                "Rakhi saved successfully.",

            "design":
                design

        }), 201


    except Exception as error:

        app.logger.exception(
            f"Failed to save design: {error}"
        )


        return jsonify({

            "success": False,

            "error":
                "Could not save the design."

        }), 500


# ============================================================
# GET ALL SAVED DESIGNS
# ============================================================

@app.route(
    "/api/designs",
    methods=["GET"]
)
def get_designs():

    """
    Get all saved Rakhi designs
    from storage/designs/
    """

    try:

        designs = []


        # ----------------------------------------------------
        # READ FILES
        # ----------------------------------------------------

        for filename in os.listdir(
            DESIGNS_DIR
        ):

            if not filename.lower().endswith(
                (
                    ".png",
                    ".jpg",
                    ".jpeg"
                )
            ):

                continue


            filepath = os.path.join(
                DESIGNS_DIR,
                filename
            )


            # ------------------------------------------------
            # GET FILE INFORMATION
            # ------------------------------------------------

            created_timestamp = os.path.getmtime(
                filepath
            )


            design_id = os.path.splitext(
                filename
            )[0]


            designs.append({

                "id":
                    design_id,

                "name":
                    "My Rakhi",

                "filename":
                    filename,

                "source":
                    "canvas",

                "created_at":
                    datetime.fromtimestamp(
                        created_timestamp
                    ).isoformat(),

                "image_url":
                    f"/storage/designs/{filename}"
            })


        # ----------------------------------------------------
        # NEWEST FIRST
        # ----------------------------------------------------

        designs.sort(
            key=lambda design:
                design["created_at"],
            reverse=True
        )


        return jsonify({

            "success": True,

            "designs":
                designs

        }), 200


    except Exception as error:

        app.logger.exception(
            f"Failed to load designs: {error}"
        )


        return jsonify({

            "success": False,

            "error":
                "Could not load saved designs."

        }), 500


# ============================================================
# GET SINGLE DESIGN
# ============================================================

@app.route(
    "/api/designs/<design_id>",
    methods=["GET"]
)
def get_single_design(design_id):

    """
    Get one saved Rakhi design.
    """

    try:

        matching_file = None


        for filename in os.listdir(
            DESIGNS_DIR
        ):

            file_id = os.path.splitext(
                filename
            )[0]


            if file_id == design_id:

                matching_file = filename

                break


        if matching_file is None:

            return jsonify({

                "success": False,

                "error":
                    "Design not found."

            }), 404


        return jsonify({

            "success": True,

            "design": {

                "id":
                    design_id,

                "filename":
                    matching_file,

                "image_url":
                    f"/storage/designs/{matching_file}"
            }

        }), 200


    except Exception as error:

        app.logger.exception(
            f"Failed to get design: {error}"
        )


        return jsonify({

            "success": False,

            "error":
                "Could not load the design."

        }), 500


# ============================================================
# DELETE DESIGN
# ============================================================

@app.route(
    "/api/designs/<design_id>",
    methods=["DELETE"]
)
def delete_design(design_id):

    """
    Delete a saved Rakhi design.
    """

    try:

        matching_file = None


        # ----------------------------------------------------
        # FIND FILE
        # ----------------------------------------------------

        for filename in os.listdir(
            DESIGNS_DIR
        ):

            file_id = os.path.splitext(
                filename
            )[0]


            if file_id == design_id:

                matching_file = filename

                break


        # ----------------------------------------------------
        # DESIGN NOT FOUND
        # ----------------------------------------------------

        if matching_file is None:

            return jsonify({

                "success": False,

                "error":
                    "Design not found."

            }), 404


        # ----------------------------------------------------
        # DELETE FILE
        # ----------------------------------------------------

        filepath = os.path.join(
            DESIGNS_DIR,
            matching_file
        )


        os.remove(
            filepath
        )


        print(
            f"Design deleted: {matching_file}"
        )


        return jsonify({

            "success": True,

            "message":
                "Design deleted successfully."

        }), 200


    except Exception as error:

        app.logger.exception(
            f"Failed to delete design: {error}"
        )


        return jsonify({

            "success": False,

            "error":
                "Could not delete the design."

        }), 500


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "success": False,

        "error":
            "The requested endpoint does not exist."

    }), 404


@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "success": False,

        "error":
            "An unexpected server error occurred."

    }), 500


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    host = os.getenv(
        "FLASK_HOST",
        "127.0.0.1"
    )


    port = int(
        os.getenv(
            "FLASK_PORT",
            "5000"
        )
    )


    debug_mode = (
        os.getenv(
            "FLASK_DEBUG",
            "True"
        ).lower() == "true"
    )


    print()

    print("=" * 60)

    print(
        "DIGITAL RAKHI"
    )

    print("=" * 60)

    print(
        f"Website: http://{host}:{port}/"
    )

    print(
        f"Health:  http://{host}:{port}/health"
    )

    print(
        f"Storage: {DESIGNS_DIR}"
    )

    print("=" * 60)

    print()


    app.run(
        host=host,
        port=port,
        debug=debug_mode
    )