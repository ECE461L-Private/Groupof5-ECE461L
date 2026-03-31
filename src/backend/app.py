"""
HaaS Backend — Flask Application Entry Point

Uses the app factory pattern so the app can be configured
differently for development, testing, and production.
"""

from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from flask_jwt_extended import JWTManager

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)   # allows cross-origin requests
    
    load_dotenv()  # reads your .env file

    # Setup the Flask-JWT-Extended extension
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-haas-key")
    jwt = JWTManager(app)

    # Connect to MongoDB
    client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/haas_db"))
    db = client["haas_db"]  # creates/uses a database called "haas_db"

    # Store db on the app so routes can access it
    app.db = db

    # ── Register route blueprints ────────────────────────────
    from routes.auth import auth_bp
    from routes.projects import projects_bp
    from routes.hardware import hardware_bp
    from routes.transactions import transactions_bp
    from routes.logs import logs_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(hardware_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(logs_bp)

    # ── Health-check root route ──────────────────────────────
    @app.route("/")
    def index():
        return {"status": "ok", "message": "Hello, World!"}

    return app


# ── Expose app globally for Serverless deployment (Vercel) ──
app = create_app()

# ── Run the dev server when executed directly ────────────────
if __name__ == "__main__":  # pragma: no cover
    app.run(debug=True, port=5001)
