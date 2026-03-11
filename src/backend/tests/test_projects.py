"""
Tests for the projects blueprint (/projects).

Uses Flask's test client to send real HTTP requests to the projects
endpoints and validates status codes, JSON structure, and content.
"""

import pytest


class TestGetProjects:
    """Tests for GET /projects/get_projects."""

    def test_get_projects_returns_200(self, client):
        """A valid request should return HTTP 200."""
        resp = client.get("/projects/get_projects?username=shaunak")
        assert resp.status_code == 200

    def test_get_projects_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.get("/projects/get_projects?username=shaunak")
        data = resp.get_json()
        assert data is not None

    def test_get_projects_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.get("/projects/get_projects?username=shaunak")
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_get_projects_message_contains_username(self, client):
        """Response message should echo back the queried username."""
        resp = client.get("/projects/get_projects?username=alice")
        data = resp.get_json()
        assert "alice" in data["message"]

    def test_get_projects_without_username(self, client):
        """Calling without the username param should still return 200 (the
        endpoint doesn't enforce it yet)."""
        resp = client.get("/projects/get_projects")
        assert resp.status_code == 200

    def test_get_projects_post_not_allowed(self, client):
        """POST to /projects/get_projects should return 405."""
        resp = client.post("/projects/get_projects")
        assert resp.status_code == 405


class TestCreateProject:
    """Tests for POST /projects/create."""

    def test_create_returns_200(self, client):
        """A valid create request should return HTTP 200."""
        resp = client.post("/projects/create", json={
            "name": "TestProject",
            "owner": "shaunak",
        })
        assert resp.status_code == 200

    def test_create_returns_json(self, client):
        """Response should be valid JSON."""
        resp = client.post("/projects/create", json={
            "name": "TestProject",
            "owner": "shaunak",
        })
        data = resp.get_json()
        assert data is not None

    def test_create_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.post("/projects/create", json={
            "name": "TestProject",
            "owner": "shaunak",
        })
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_create_message_contains_project_name(self, client):
        """Response message should echo the project name."""
        resp = client.post("/projects/create", json={
            "name": "MyProject",
            "owner": "bob",
        })
        data = resp.get_json()
        assert "MyProject" in data["message"]

    def test_create_message_contains_owner(self, client):
        """Response message should echo the owner."""
        resp = client.post("/projects/create", json={
            "name": "MyProject",
            "owner": "bob",
        })
        data = resp.get_json()
        assert "bob" in data["message"]

    def test_create_wrong_method_returns_405(self, client):
        """GET requests to /projects/create should be rejected with 405."""
        resp = client.get("/projects/create")
        assert resp.status_code == 405

    def test_create_response_keys(self, client):
        """Response JSON should contain exactly 'status' and 'message'."""
        resp = client.post("/projects/create", json={
            "name": "Test",
            "owner": "owner",
        })
        data = resp.get_json()
        assert set(data.keys()) == {"status", "message"}


class TestJoinProject:
    """Tests for POST /projects/join."""

    def test_join_returns_200(self, client):
        """A valid join request should return HTTP 200."""
        resp = client.post("/projects/join", json={
            "project_id": "proj_001",
            "username": "lakshya",
        })
        assert resp.status_code == 200

    def test_join_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.post("/projects/join", json={
            "project_id": "proj_001",
            "username": "lakshya",
        })
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_join_message_contains_username(self, client):
        """Response message should echo the username."""
        resp = client.post("/projects/join", json={
            "project_id": "proj_001",
            "username": "jose",
        })
        data = resp.get_json()
        assert "jose" in data["message"]

    def test_join_message_contains_project_id(self, client):
        """Response message should echo the project_id."""
        resp = client.post("/projects/join", json={
            "project_id": "proj_xyz",
            "username": "lakshya",
        })
        data = resp.get_json()
        assert "proj_xyz" in data["message"]

    def test_join_wrong_method_returns_405(self, client):
        """GET requests to /projects/join should be rejected with 405."""
        resp = client.get("/projects/join")
        assert resp.status_code == 405


class TestGetProjectInfo:
    """Tests for GET /projects/get_project_info."""

    def test_get_project_info_returns_200(self, client):
        """A valid request should return HTTP 200."""
        resp = client.get("/projects/get_project_info?project_id=proj_001")
        assert resp.status_code == 200

    def test_get_project_info_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.get("/projects/get_project_info?project_id=proj_001")
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_get_project_info_message_contains_id(self, client):
        """Response message should echo the project_id."""
        resp = client.get("/projects/get_project_info?project_id=proj_abc")
        data = resp.get_json()
        assert "proj_abc" in data["message"]

    def test_get_project_info_without_id(self, client):
        """Calling without project_id param still returns 200."""
        resp = client.get("/projects/get_project_info")
        assert resp.status_code == 200

    def test_get_project_info_content_type(self, client):
        """Response Content-Type should be application/json."""
        resp = client.get("/projects/get_project_info?project_id=proj_001")
        assert resp.content_type == "application/json"
