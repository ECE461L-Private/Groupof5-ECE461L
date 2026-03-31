"""
Projects routes — /projects

Endpoints for creating, joining, and viewing projects.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid

projects_bp = Blueprint("projects", __name__, url_prefix="/projects")

@projects_bp.route("/get_projects", methods=["GET"])
@jwt_required()
def get_projects():
    """
    Get all projects associated with a user.
    """
    username = get_jwt_identity()

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
@jwt_required()
def create():
    """
    Create a new project.

    Expects JSON: { "name": str }
    """
    data = request.get_json()
    name = data.get("name")
    owner = get_jwt_identity()

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
@jwt_required()
def join():
    """
    Join an existing project.

    Expects JSON: { "project_id": str }
    """
    data = request.get_json()
    project_id = data.get("project_id")
    username = get_jwt_identity()

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

def _delete_project_logic(project_id):
    """
    Helper function to delete a project, release hardware, and remove from all members.
    """
    project = current_app.db.projects.find_one({"_id": project_id})
    if not project:
        return

    # 1. Release all hardware checked out by this project
    hw_cursor = current_app.db.hardware.find({f"projects.{project_id}": {"$exists": True}})
    for hw in hw_cursor:
        quantity = hw.get("projects", {}).get(project_id, 0)
        if quantity > 0:
            current_app.db.hardware.update_one(
                {"_id": hw["_id"]},
                {"$inc": {"available": quantity}, "$unset": {f"projects.{project_id}": ""}}
            )

    # 2. Remove project from all members' project lists
    members = project.get("members", [])
    if members:
        current_app.db.users.update_many(
            {"username": {"$in": members}},
            {"$pull": {"projects": project_id}}
        )

    # 3. Delete the project
    current_app.db.projects.delete_one({"_id": project_id})


@projects_bp.route("/leave", methods=["POST"])
@jwt_required()
def leave():
    """
    Leave a project. If the user is the owner, the project is deleted.
    Expects JSON: { "project_id": str }
    """
    data = request.get_json()
    project_id = data.get("project_id")
    username = get_jwt_identity()

    if not project_id:
        return jsonify({"status": "error", "message": "project_id is required"}), 400

    project = current_app.db.projects.find_one({"_id": project_id})
    if not project:
        return jsonify({"status": "error", "message": "Project not found"}), 404

    if username not in project.get("members", []):
        return jsonify({"status": "error", "message": "You are not a member of this project"}), 400

    # If user is owner, delete the whole project
    if project.get("owner") == username:
        _delete_project_logic(project_id)
        return jsonify({
            "status": "ok", 
            "message": f"Owner left. Project '{project_id}' deleted and hardware returned."
        }), 200

    # Otherwise, just remove the user
    current_app.db.projects.update_one(
        {"_id": project_id},
        {"$pull": {"members": username}}
    )
    current_app.db.users.update_one(
        {"username": username},
        {"$pull": {"projects": project_id}}
    )

    return jsonify({
        "status": "ok",
        "message": f"User '{username}' naturally left project '{project_id}'"
    }), 200


@projects_bp.route("/delete", methods=["DELETE"])
@jwt_required()
def delete():
    """
    Delete a project. Only the owner can execute this.
    Expects JSON: { "project_id": str }
    """
    data = request.get_json()
    project_id = data.get("project_id")
    username = get_jwt_identity()

    if not project_id:
         return jsonify({"status": "error", "message": "project_id is required"}), 400
    
    project = current_app.db.projects.find_one({"_id": project_id})
    if not project:
         return jsonify({"status": "error", "message": "Project not found"}), 404

    if project.get("owner") != username:
         return jsonify({"status": "error", "message": "Only the project owner can delete it"}), 403

    _delete_project_logic(project_id)
    
    return jsonify({
        "status": "ok",
        "message": f"Project '{project_id}' deleted and hardware returned."
    }), 200


@projects_bp.route("/get_project_info", methods=["GET"])
@jwt_required()
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
