"""
Logs routes — /logs

Endpoints for viewing and adding activity logs.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime

logs_bp = Blueprint("logs", __name__, url_prefix="/logs")

@logs_bp.route("/add", methods=["POST"])
@jwt_required()
def add_log():
    """
    Add a new activity log.
    Expects JSON: { "message": str }
    """
    data = request.get_json()
    message = data.get("message")
    username = get_jwt_identity()

    if not message:
        return jsonify({"status": "error", "message": "message is required"}), 400

    current_app.db.logs.insert_one({
        "username": username,
        "message": message,
        "timestamp": datetime.datetime.utcnow()
    })

    return jsonify({"status": "ok", "message": "Log added successfully"}), 201


@logs_bp.route("/list", methods=["GET"])
@jwt_required()
def list_logs():
    """
    Get the 20 most recent logs for the authenticated user.
    """
    username = get_jwt_identity()

    # Search logs belonging to this username, sort by descending timestamp, limit to 20
    logs_cursor = current_app.db.logs.find({"username": username}).sort("timestamp", -1).limit(20)

    logs_list = []
    for log in logs_cursor:
        time_str = log["timestamp"].strftime("%I:%M:%S %p") if "timestamp" in log else ""
        logs_list.append({
            "msg": log["message"],
            "time": time_str
        })

    return jsonify({
        "status": "ok",
        "logs": logs_list
    }), 200
