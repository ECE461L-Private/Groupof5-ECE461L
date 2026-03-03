"""
HaaS Backend — Flask Application Entry Point

Uses the app factory pattern so the app can be configured
differently for development, testing, and production.
"""

from flask import Flask


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # ── Register route blueprints ────────────────────────────
    from routes.auth import auth_bp
    from routes.projects import projects_bp
    from routes.hardware import hardware_bp
    #from routes.transactions import transactions_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(hardware_bp)
    #app.register_blueprint(transactions_bp)

    # ── Health-check root route ──────────────────────────────
    @app.route("/")
    def index():
        return {"status": "ok", "message": "Hello, World!"}

    return app


# ── Run the dev server when executed directly ────────────────
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
