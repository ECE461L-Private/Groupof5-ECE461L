"""
Projects routes — /projects

Endpoints for creating, joining, and viewing projects.
"""

from flask import Blueprint, request, jsonify, current_app
import uuid

projects_bp = Blueprint("projects", __name__, url_prefix="/projects")

@projects_bp.route("/get_projects", methods=["GET"])
def get_projects():
    """
    Get all projects associated with a user.

    Expects query param: ?username=<username>
    """
    username = request.args.get("username")

    if not username:
        return jsonify({
            "status": "error",
            "message": "Username is required",
        }), 400

    user = current_app.db.users.find_one({"username": username})
    if not user:
        return jsonify({
            "status": "error",
            "message": f"User '{username}' not found",
        }), 404

    project_ids = user.get("projects", [])
    
    # fetch project documents
    projects_cursor = current_app.db.projects.find({"_id": {"$in": project_ids}})
    projects = []
    for proj in projects_cursor:
        # include available hardware info if any (though usually handled by hardware route)
        proj_data = {
            "project_id": proj["_id"],
            "name": proj.get("name"),
            "owner": proj.get("owner"),
            "members": proj.get("members", [])
        }
        projects.append(proj_data)

    return jsonify({
        "status": "ok",
        "message": f"Fetched {len(projects)} projects for '{username}'",
        "projects": projects
    }), 200

@projects_bp.route("/create", methods=["POST"])
def create():
    """
    Create a new project.

    Expects JSON: { "name": str, "owner": str }
    """
    data = request.get_json()
    name = data.get("name")
    owner = data.get("owner")

    if not name or not owner:
        return jsonify({
            "status": "error",
            "message": "Project name and owner are required",
        }), 400

    # check if user exists
    user = current_app.db.users.find_one({"username": owner})
    if not user:
        return jsonify({
            "status": "error",
            "message": f"Owner '{owner}' not found",
        }), 404

    project_id = f"proj_{uuid.uuid4().hex[:8]}"

    # create project in db
    new_project = {
        "_id": project_id,
        "name": name,
        "owner": owner,
        "members": [owner]
    }
    
    current_app.db.projects.insert_one(new_project)

    # append to user's projects array
    current_app.db.users.update_one(
        {"username": owner},
        {"$addToSet": {"projects": project_id}}
    )

    return jsonify({
        "status": "ok",
        "message": f"Project '{name}' created successfully by '{owner}'",
        "project_id": project_id
    }), 201


@projects_bp.route("/join", methods=["POST"])
def join():
    """
    Join an existing project.

    Expects JSON: { "project_id": str, "username": str }
    """
    data = request.get_json()
    project_id = data.get("project_id")
    username = data.get("username")

    if not project_id or not username:
        return jsonify({
            "status": "error",
            "message": "project_id and username are required",
        }), 400

    # check if project exists
    project = current_app.db.projects.find_one({"_id": project_id})
    if not project:
        return jsonify({
            "status": "error",
            "message": f"Project '{project_id}' not found",
        }), 404

    # check if user exists
    user = current_app.db.users.find_one({"username": username})
    if not user:
        return jsonify({
            "status": "error",
            "message": f"User '{username}' not found",
        }), 404

    if username in project.get("members", []):
         return jsonify({
            "status": "error",
            "message": f"User '{username}' is already in project '{project_id}'",
        }), 409
    
    # add user to project members
    current_app.db.projects.update_one(
        {"_id": project_id},
        {"$addToSet": {"members": username}}
    )

    # add project to user's projects list
    current_app.db.users.update_one(
        {"username": username},
        {"$addToSet": {"projects": project_id}}
    )

    return jsonify({
        "status": "ok",
        "message": f"User '{username}' successfully joined project '{project_id}'",
    }), 200


@projects_bp.route("/get_project_info", methods=["GET"])
def get_project_info():
    """
    Get details for a specific project.

    Expects query param: ?project_id=<id>
    """
    project_id = request.args.get("project_id")

    if not project_id:
        return jsonify({
            "status": "error",
            "message": "project_id is required",
        }), 400

    project = current_app.db.projects.find_one({"_id": project_id})
    
    if not project:
         return jsonify({
            "status": "error",
            "message": f"Project '{project_id}' not found",
        }), 404

    return jsonify({
        "status": "ok",
        "message": f"Successfully fetched project '{project_id}' info",
        "project": {
            "project_id": project["_id"],
            "name": project.get("name"),
            "owner": project.get("owner"),
            "members": project.get("members", [])
        }
    }), 200
