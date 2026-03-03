"""
Hardware routes — /hardware

Endpoints for listing hardware sets and viewing individual hardware info.
"""

from flask import Blueprint, request, jsonify

hardware_bp = Blueprint("hardware", __name__, url_prefix="/hardware")


@hardware_bp.route("/list", methods=["GET"])
def list_hardware():
    """
    List all hardware sets with capacity and availability.
    """
    # TODO: query MongoDB for all hardware set documents
    return jsonify({
        "status": "ok",
        "message": "list endpoint hit — returns all hardware sets",
    })


@hardware_bp.route("/get_hw_info", methods=["GET"])
def get_hw_info():
    """
    Get details for a specific hardware set.

    Expects query param: ?hw_id=<id>
    """
    hw_id = request.args.get("hw_id")

    # TODO: look up hardware set in MongoDB by hw_id
    return jsonify({
        "status": "ok",
        "message": f"get_hw_info endpoint hit for hardware '{hw_id}'",
    })
