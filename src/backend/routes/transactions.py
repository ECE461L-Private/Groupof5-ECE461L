"""
Transactions routes — /transactions

Endpoints for checking hardware in and out of projects.
"""

from flask import Blueprint, request, jsonify

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


@transactions_bp.route("/check_out", methods=["POST"])
def check_out():
    """
    Check out hardware for a project.

    Expects JSON: { "project_id": str, "hw_id": str, "quantity": int }
    """
    data = request.get_json()
    project_id = data.get("project_id")
    hw_id = data.get("hw_id")
    quantity = data.get("quantity")

    # TODO: validate availability, update hardware counts in MongoDB,
    #       record transaction against the project
    return jsonify({
        "status": "ok",
        "message": f"check_out endpoint hit — {quantity} units of '{hw_id}' for project '{project_id}'",
    })


@transactions_bp.route("/check_in", methods=["POST"])
def check_in():
    """
    Check in hardware from a project.

    Expects JSON: { "project_id": str, "hw_id": str, "quantity": int }
    """
    data = request.get_json()
    project_id = data.get("project_id")
    hw_id = data.get("hw_id")
    quantity = data.get("quantity")

    # TODO: validate that project has enough checked-out units,
    #       update hardware counts in MongoDB, record transaction
    return jsonify({
        "status": "ok",
        "message": f"check_in endpoint hit — {quantity} units of '{hw_id}' from project '{project_id}'",
    })
