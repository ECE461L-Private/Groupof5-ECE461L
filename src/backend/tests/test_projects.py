"""
Tests for project routes with current JWT-protected behavior.
"""

from unittest.mock import patch


class TestGetProjects:
    def test_get_projects_returns_projects_for_authenticated_user(self, client, app, auth_headers):
        headers = auth_headers("shaunak", "xyz12345")
        app.db.projects.insert_one({"_id": "proj_1", "name": "Alpha", "owner": "shaunak", "members": ["shaunak"]})
        app.db.users.update_one({"username": "shaunak"}, {"$set": {"projects": ["proj_1"]}})

        resp = client.get("/projects/get_projects", headers=headers)
        data = resp.get_json()

        assert resp.status_code == 200
        assert data["status"] == "ok"
        assert "shaunak" in data["message"]
        assert data["projects"] == [
            {"project_id": "proj_1", "name": "Alpha", "owner": "shaunak", "members": ["shaunak"]}
        ]

    def test_get_projects_returns_404_when_user_is_missing(self, client, app, auth_headers):
        headers = auth_headers("alice", "xyz12345")
        app.db.users.delete_one({"username": "alice"})

        resp = client.get("/projects/get_projects", headers=headers)

        assert resp.status_code == 404
        assert resp.get_json()["status"] == "error"

    def test_get_projects_returns_400_when_identity_is_missing(self, client, auth_headers):
        with patch("routes.projects.get_jwt_identity", return_value=None):
            resp = client.get("/projects/get_projects", headers=auth_headers("shaunak", "xyz12345"))

        assert resp.status_code == 400
        assert resp.get_json()["message"] == "Username is required"

    def test_get_projects_post_not_allowed(self, client):
        assert client.post("/projects/get_projects").status_code == 405


class TestCreateProject:
    def test_create_returns_project_id_and_updates_owner(self, client, app, auth_headers):
        headers = auth_headers("owner", "xyz12345")

        resp = client.post("/projects/create", json={"name": "Test Project"}, headers=headers)
        data = resp.get_json()

        assert resp.status_code == 201
        assert data["status"] == "ok"
        assert "owner" in data["message"]
        assert data["project_id"].startswith("proj_")
        assert app.db.users.find_one({"username": "owner"})["projects"] == [data["project_id"]]

    def test_create_requires_name(self, client, auth_headers):
        resp = client.post("/projects/create", json={}, headers=auth_headers("owner", "xyz12345"))
        assert resp.status_code == 400

    def test_create_returns_404_when_owner_user_missing(self, client, app, auth_headers):
        headers = auth_headers("owner", "xyz12345")
        app.db.users.delete_one({"username": "owner"})

        resp = client.post("/projects/create", json={"name": "Test"}, headers=headers)

        assert resp.status_code == 404
        assert resp.get_json()["status"] == "error"

    def test_create_wrong_method_returns_405(self, client):
        assert client.get("/projects/create").status_code == 405


class TestJoinProject:
    def test_join_adds_user_to_project_and_profile(self, client, app, auth_headers):
        owner_headers = auth_headers("owner", "xyz12345")
        joiner_headers = auth_headers("joiner", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=owner_headers).get_json()["project_id"]

        resp = client.post("/projects/join", json={"project_id": project_id}, headers=joiner_headers)
        data = resp.get_json()

        assert resp.status_code == 200
        assert data["status"] == "ok"
        assert "joiner" in data["message"]
        assert project_id in app.db.users.find_one({"username": "joiner"})["projects"]
        assert "joiner" in app.db.projects.find_one({"_id": project_id})["members"]

    def test_join_requires_project_id(self, client, auth_headers):
        resp = client.post("/projects/join", json={}, headers=auth_headers("joiner", "xyz12345"))
        assert resp.status_code == 400

    def test_join_returns_404_for_missing_project(self, client, auth_headers):
        resp = client.post("/projects/join", json={"project_id": "missing"}, headers=auth_headers("joiner", "xyz12345"))
        assert resp.status_code == 404

    def test_join_returns_404_for_missing_user(self, client, app, auth_headers):
        owner_headers = auth_headers("owner", "xyz12345")
        joiner_headers = auth_headers("joiner", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=owner_headers).get_json()["project_id"]
        app.db.users.delete_one({"username": "joiner"})

        resp = client.post("/projects/join", json={"project_id": project_id}, headers=joiner_headers)

        assert resp.status_code == 404
        assert resp.get_json()["status"] == "error"

    def test_join_returns_409_when_user_already_member(self, client, auth_headers):
        headers = auth_headers("owner", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]

        resp = client.post("/projects/join", json={"project_id": project_id}, headers=headers)

        assert resp.status_code == 409
        assert resp.get_json()["status"] == "error"

    def test_join_wrong_method_returns_405(self, client):
        assert client.get("/projects/join").status_code == 405


class TestLeaveProject:
    def test_leave_removes_non_owner_from_project(self, client, app, auth_headers):
        owner_headers = auth_headers("owner", "xyz12345")
        member_headers = auth_headers("member", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=owner_headers).get_json()["project_id"]
        client.post("/projects/join", json={"project_id": project_id}, headers=member_headers)

        resp = client.post("/projects/leave", json={"project_id": project_id}, headers=member_headers)

        assert resp.status_code == 200
        assert "member" not in app.db.projects.find_one({"_id": project_id})["members"]
        assert project_id not in app.db.users.find_one({"username": "member"})["projects"]

    def test_leave_deletes_project_when_owner_leaves(self, client, app, auth_headers):
        headers = auth_headers("owner", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]
        app.db.hardware.insert_one(
            {"_id": "hw_1", "name": "Kit", "capacity": 10, "available": 7, "projects": {project_id: 3}}
        )

        resp = client.post("/projects/leave", json={"project_id": project_id}, headers=headers)

        assert resp.status_code == 200
        assert app.db.projects.find_one({"_id": project_id}) is None
        assert app.db.hardware.find_one({"_id": "hw_1"})["available"] == 10

    def test_leave_requires_project_id(self, client, auth_headers):
        assert client.post("/projects/leave", json={}, headers=auth_headers("owner", "xyz12345")).status_code == 400

    def test_leave_returns_404_for_missing_project(self, client, auth_headers):
        assert (
            client.post("/projects/leave", json={"project_id": "missing"}, headers=auth_headers("owner", "xyz12345")).status_code
            == 404
        )

    def test_leave_rejects_non_member(self, client, auth_headers):
        owner_headers = auth_headers("owner", "xyz12345")
        outsider_headers = auth_headers("outsider", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=owner_headers).get_json()["project_id"]

        resp = client.post("/projects/leave", json={"project_id": project_id}, headers=outsider_headers)

        assert resp.status_code == 400
        assert resp.get_json()["status"] == "error"


class TestDeleteProject:
    def test_delete_project_returns_hardware_and_removes_memberships(self, client, app, auth_headers):
        owner_headers = auth_headers("owner", "xyz12345")
        member_headers = auth_headers("member", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=owner_headers).get_json()["project_id"]
        client.post("/projects/join", json={"project_id": project_id}, headers=member_headers)
        app.db.hardware.insert_one(
            {"_id": "hw_1", "name": "Kit", "capacity": 10, "available": 8, "projects": {project_id: 2}}
        )

        resp = client.delete("/projects/delete", json={"project_id": project_id}, headers=owner_headers)

        assert resp.status_code == 200
        assert app.db.projects.find_one({"_id": project_id}) is None
        assert app.db.users.find_one({"username": "member"})["projects"] == []
        assert app.db.hardware.find_one({"_id": "hw_1"})["available"] == 10

    def test_delete_requires_project_id(self, client, auth_headers):
        assert client.delete("/projects/delete", json={}, headers=auth_headers("owner", "xyz12345")).status_code == 400

    def test_delete_returns_404_for_missing_project(self, client, auth_headers):
        assert (
            client.delete("/projects/delete", json={"project_id": "missing"}, headers=auth_headers("owner", "xyz12345")).status_code
            == 404
        )

    def test_delete_rejects_non_owner(self, client, auth_headers):
        owner_headers = auth_headers("owner", "xyz12345")
        member_headers = auth_headers("member", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=owner_headers).get_json()["project_id"]

        resp = client.delete("/projects/delete", json={"project_id": project_id}, headers=member_headers)

        assert resp.status_code == 403
        assert resp.get_json()["status"] == "error"

    def test_delete_project_logic_returns_when_project_is_missing(self, app):
        from routes.projects import _delete_project_logic

        with app.app_context():
            _delete_project_logic("missing")

        assert app.db.projects.find_one({"_id": "missing"}) is None


class TestGetProjectInfo:
    def test_get_project_info_returns_project(self, client, auth_headers):
        headers = auth_headers("owner", "xyz12345")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]

        resp = client.get(f"/projects/get_project_info?project_id={project_id}", headers=headers)
        data = resp.get_json()

        assert resp.status_code == 200
        assert data["status"] == "ok"
        assert data["project"]["project_id"] == project_id

    def test_get_project_info_requires_id(self, client, auth_headers):
        assert client.get("/projects/get_project_info", headers=auth_headers("owner", "xyz12345")).status_code == 400

    def test_get_project_info_returns_404_for_missing_project(self, client, auth_headers):
        assert (
            client.get("/projects/get_project_info?project_id=missing", headers=auth_headers("owner", "xyz12345")).status_code
            == 404
        )

    def test_get_project_info_content_type(self, client, auth_headers):
        resp = client.get("/projects/get_project_info?project_id=missing", headers=auth_headers("owner", "xyz12345"))
        assert resp.content_type == "application/json"
