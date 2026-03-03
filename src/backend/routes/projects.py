"""
Projects routes — /projects

Endpoints for creating, joining, and viewing projects.
"""

from flask import Blueprint, request, jsonify

projects_bp = Blueprint("projects", __name__, url_prefix="/projects")

# We might want to add a route to get all projects associated with a user
@projects_bp.route("/get_projects", methods=["GET"])
def get_projects():
    """
    Get all projects associated with a user.

    Expects query param: ?username=<username>
    """
    username = request.args.get("username")

    # TODO: look up projects in MongoDB and return their data
    return jsonify({
        "status": "ok",
        "message": f"get_projects endpoint hit for user '{username}'",
    })

@projects_bp.route("/create", methods=["POST"])
def create():
    """
    Create a new project.

    Expects JSON: { "name": str, "owner": str }
    """
    data = request.get_json()
    name = data.get("name")
    owner = data.get("owner")

    # TODO: validate input, create project doc in MongoDB with owner as first member
    return jsonify({
        "status": "ok",
        "message": f"create endpoint hit — project '{name}' by '{owner}'",
    })


@projects_bp.route("/join", methods=["POST"])
def join():
    """
    Join an existing project.

    Expects JSON: { "project_id": str, "username": str }
    """
    data = request.get_json()
    project_id = data.get("project_id")
    username = data.get("username")

    # TODO: look up project in DB, add username to members list
    return jsonify({
        "status": "ok",
        "message": f"join endpoint hit — user '{username}' joining project '{project_id}'",
    })


@projects_bp.route("/get_project_info", methods=["GET"])
def get_project_info():
    """
    Get details for a specific project.

    Expects query param: ?project_id=<id>
    """
    project_id = request.args.get("project_id")

    # TODO: look up project in MongoDB and return its data
    return jsonify({
        "status": "ok",
        "message": f"get_project_info endpoint hit for project '{project_id}'",
    })
