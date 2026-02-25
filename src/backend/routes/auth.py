"""
Auth routes — /auth

Endpoints for user login and registration.
"""

from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate an existing user.

    Expects JSON: { "username": str, "password": str }
    """
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    # TODO: look up user in DB and verify hashed password with bcrypt
    return jsonify({
        "status": "ok",
        "message": f"login endpoint hit for user '{username}'",
    })


@auth_bp.route("/add_user", methods=["POST"])
def add_user():
    """
    Register a new user account.

    Expects JSON: { "username": str, "password": str }
    """
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    # TODO: validate input, hash password with bcrypt, store in MongoDB
    return jsonify({
        "status": "ok",
        "message": f"add_user endpoint hit for user '{username}'",
    })
