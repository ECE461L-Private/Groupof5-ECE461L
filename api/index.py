import sys
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from werkzeug.middleware.dispatcher import DispatcherMiddleware

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST = ROOT / "src" / "frontend" / "dist"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.backend.app import create_app

backend_app = create_app()
app = Flask(__name__)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if not FRONTEND_DIST.exists():
        return jsonify({
            "status": "error",
            "message": "Frontend build output is missing",
        }), 500

    asset_path = FRONTEND_DIST / path
    if path and asset_path.is_file():
        return send_from_directory(FRONTEND_DIST, path)

    return send_from_directory(FRONTEND_DIST, "index.html")


app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
    "/api": backend_app,
})
