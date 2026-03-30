"""
Auth routes — /auth

Endpoints for user login and registration.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt

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

    # validate input
    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Username and password are required",
        }), 400 # bad request
    
    # look up user in DB
    user = current_app.db.users.find_one({"username": username})
    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found",
        }), 404 # not found
    
    # verify hashed password with bcrypt
    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({
            "status": "error",
            "message": "Invalid password",
        }), 401 # unauthorized
    
    access_token = create_access_token(identity=username)
    
    return jsonify({
        "status": "ok",
        "message": f"User '{username}' logged in successfully",
        "access_token": access_token
    }), 200 # Successful Login


@auth_bp.route("/add_user", methods=["POST"])
def add_user():
    """
    Register a new user account.

    Expects JSON: { "username": str, "password": str }
    """
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    # validate input
    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Username and password are required",
        }), 400 # bad request
    
    # check if user already exists
    user = current_app.db.users.find_one({"username": username})
    if user:
        return jsonify({
            "status": "error",
            "message": "Username already exists",
        }), 409 # conflict - user already exists
    
    # hash password
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    
    # insert user into database
    current_app.db.users.insert_one({
        "username": username,
        "password": hashed_password,
    })

    access_token = create_access_token(identity=username)

    return jsonify({
        "status": "ok",
        "message": f"User '{username}' created successfully",
        "access_token": access_token
    }), 201 # Successful Creation

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """
    Get realistic profile data for the authenticated user.
    """
    username = get_jwt_identity()

    user = current_app.db.users.find_one({"username": username})
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    project_ids = user.get("projects", [])
    
    projects_data = []
    usage_data = []

    # fetch project documents
    projects_cursor = current_app.db.projects.find({"_id": {"$in": project_ids}})
    
    for proj in projects_cursor:
        pid = proj["_id"]
        pname = proj.get("name", "Unknown Project")
        
        projects_data.append({
            "id": pid,
            "name": pname
        })
        
        # Calculate usage for this project
        total_units = 0
        hw_cursor = current_app.db.hardware.find({f"projects.{pid}": {"$exists": True}})
        
        for hw in hw_cursor:
            alloc_amount = hw.get("projects", {}).get(pid, 0)
            total_units += alloc_amount
            
        if total_units > 0:
            usage_data.append({
                "project_name": pname,
                "units": total_units
            })

    return jsonify({
        "status": "ok",
        "data": {
            "username": username,
            "projects": projects_data,
            "usage": usage_data
        }
    }), 200
