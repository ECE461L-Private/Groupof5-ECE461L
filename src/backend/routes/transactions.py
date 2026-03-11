"""
Transactions routes — /transactions

Endpoints for checking hardware in and out of projects.
"""

from flask import Blueprint, request, jsonify, current_app

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

    if not project_id or not hw_id or quantity is None:
        return jsonify({
            "status": "error",
            "message": "project_id, hw_id, and quantity are required",
        }), 400

    try:
        quantity = int(quantity)
        if quantity <= 0:
            raise ValueError()
    except ValueError:
       return jsonify({
            "status": "error",
            "message": "Quantity must be a positive integer",
        }), 400
       
    # check that project exists
    project = current_app.db.projects.find_one({"_id": project_id})
    if not project:
         return jsonify({
            "status": "error",
            "message": f"Project '{project_id}' not found",
        }), 404

    # check that hardware exists
    hw = current_app.db.hardware.find_one({"_id": hw_id})
    if not hw:
         return jsonify({
            "status": "error",
            "message": f"Hardware '{hw_id}' not found",
        }), 404

    # check availability
    checked_out_total = sum(hw.get("projects", {}).values())
    available = hw.get("capacity", 0) - checked_out_total

    if quantity > available:
         return jsonify({
            "status": "error",
            "message": f"Cannot check out {quantity} units. Only {available} available.",
        }), 400

    # allocate hardware in the db
    current_app.db.hardware.update_one(
        {"_id": hw_id},
        {"$inc": {f"projects.{project_id}": quantity}}
    )

    return jsonify({
        "status": "ok",
        "message": f"Successfully checked out {quantity} units of '{hw_id}' for project '{project_id}'",
    }), 200


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

    if not project_id or not hw_id or quantity is None:
        return jsonify({
            "status": "error",
            "message": "project_id, hw_id, and quantity are required",
        }), 400

    try:
        quantity = int(quantity)
        if quantity <= 0:
            raise ValueError()
    except ValueError:
       return jsonify({
            "status": "error",
            "message": "Quantity must be a positive integer",
        }), 400

    # check that hardware exists
    hw = current_app.db.hardware.find_one({"_id": hw_id})
    if not hw:
         return jsonify({
            "status": "error",
            "message": f"Hardware '{hw_id}' not found",
        }), 404

    # check how many the project currently holds
    project_allocations = hw.get("projects", {})
    currently_held = project_allocations.get(project_id, 0)

    if quantity > currently_held:
        return jsonify({
            "status": "error",
            "message": f"Cannot check in {quantity} units. Project '{project_id}' only has {currently_held} checked out.",
        }), 400

    # dec hardware in the db
    # We use $inc with a negative number to subtract
    current_app.db.hardware.update_one(
        {"_id": hw_id},
        {"$inc": {f"projects.{project_id}": -quantity}}
    )

    return jsonify({
        "status": "ok",
        "message": f"Successfully checked in {quantity} units of '{hw_id}' from project '{project_id}'",
    }), 200
