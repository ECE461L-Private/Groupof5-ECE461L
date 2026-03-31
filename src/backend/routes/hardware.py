"""
Hardware routes — /hardware

Endpoints for listing hardware sets and viewing individual hardware info.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

hardware_bp = Blueprint("hardware", __name__, url_prefix="/api/hardware")

def init_hardware_if_empty():
    """Populate default hardware sets if the collection is entirely empty."""
    if current_app.db.hardware.count_documents({}) == 0:
        current_app.db.hardware.insert_many([
            {
                "_id": "hw_set_1",
                "name": "HWSet1",
                "capacity": 100,
                "available": 100,
                "projects": {}
            },
            {
                "_id": "hw_set_2",
                "name": "HWSet2",
                "capacity": 100,
                "available": 100,
                "projects": {}
            }
        ])


@hardware_bp.route("/list", methods=["GET"])
@jwt_required()
def list_hardware():
    """
    List all hardware sets with capacity and availability.
    """
    init_hardware_if_empty()

    hw_cursor = current_app.db.hardware.find({})
    hardware_list = []
    
    for hw in hw_cursor:
        hardware_list.append({
            "hw_id": hw["_id"],
            "name": hw.get("name"),
            "capacity": hw.get("capacity"),
            "available": hw.get("available", hw.get("capacity", 0)),
            "allocations": hw.get("projects", {})
        })

    return jsonify({
        "status": "ok",
        "message": f"Successfully fetched {len(hardware_list)} hardware sets",
        "hardware": hardware_list
    }), 200


@hardware_bp.route("/get_hw_info", methods=["GET"])
@jwt_required()
def get_hw_info():
    """
    Get details for a specific hardware set.

    Expects query param: ?hw_id=<id>
    """
    init_hardware_if_empty()

    hw_id = request.args.get("hw_id")

    if not hw_id:
        return jsonify({
            "status": "error",
            "message": "hw_id is required",
        }), 400

    hw = current_app.db.hardware.find_one({"_id": hw_id})

    if not hw:
        return jsonify({
            "status": "error",
            "message": f"Hardware '{hw_id}' not found",
        }), 404

    return jsonify({
        "status": "ok",
        "message": f"Successfully fetched hardware '{hw_id}' info",
        "hardware": {
            "hw_id": hw["_id"],
            "name": hw.get("name"),
            "capacity": hw.get("capacity"),
            "available": hw.get("available", hw.get("capacity", 0)),
            "allocations": hw.get("projects", {})
        }
    }), 200
