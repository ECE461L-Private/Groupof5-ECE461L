"""
Tests for the auth blueprint (/auth).

Uses Flask's test client to send real HTTP requests to the login
and add_user endpoints and validates status codes, JSON structure,
and response content — including error paths introduced by bcrypt
password hashing and input validation.
"""

import pytest


class TestAddUserEndpoint:
    """Tests for POST /auth/add_user."""

    def test_add_user_returns_201(self, client):
        """A valid add_user request should return HTTP 201."""
        resp = client.post("/auth/add_user", json={
            "username": "newuser",
            "password": "newpass123",
        })
        assert resp.status_code == 201

    def test_add_user_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.post("/auth/add_user", json={
            "username": "newuser",
            "password": "newpass123",
        })
        data = resp.get_json()
        assert data is not None

    def test_add_user_has_status_ok(self, client):
        """The JSON body should contain status == 'ok'."""
        resp = client.post("/auth/add_user", json={
            "username": "newuser",
            "password": "newpass123",
        })
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_add_user_message_contains_username(self, client):
        """The response message should echo back the submitted username."""
        resp = client.post("/auth/add_user", json={
            "username": "bob",
            "password": "b0bpass",
        })
        data = resp.get_json()
        assert "bob" in data["message"]

    def test_add_user_wrong_method_returns_405(self, client):
        """GET requests to /auth/add_user should be rejected with 405."""
        resp = client.get("/auth/add_user")
        assert resp.status_code == 405

    def test_add_user_response_keys(self, client):
        """Response JSON should contain exactly 'status' and 'message' keys."""
        resp = client.post("/auth/add_user", json={
            "username": "newuser",
            "password": "newpass",
        })
        data = resp.get_json()
        assert set(data.keys()) == {"status", "message"}

    def test_add_user_missing_username_returns_400(self, client):
        """Omitting the username should return HTTP 400."""
        resp = client.post("/auth/add_user", json={
            "password": "somepass",
        })
        assert resp.status_code == 400

    def test_add_user_missing_password_returns_400(self, client):
        """Omitting the password should return HTTP 400."""
        resp = client.post("/auth/add_user", json={
            "username": "someuser",
        })
        assert resp.status_code == 400

    def test_add_user_empty_body_returns_400(self, client):
        """Sending an empty JSON body should return HTTP 400."""
        resp = client.post("/auth/add_user", json={})
        assert resp.status_code == 400

    def test_add_user_duplicate_returns_409(self, client):
        """Registering the same username twice should return HTTP 409."""
        client.post("/auth/add_user", json={
            "username": "duplicate",
            "password": "pass1",
        })
        resp = client.post("/auth/add_user", json={
            "username": "duplicate",
            "password": "pass2",
        })
        assert resp.status_code == 409

    def test_add_user_duplicate_has_error_status(self, client):
        """Duplicate registration should return status == 'error'."""
        client.post("/auth/add_user", json={
            "username": "dup_user",
            "password": "pass1",
        })
        resp = client.post("/auth/add_user", json={
            "username": "dup_user",
            "password": "pass2",
        })
        data = resp.get_json()
        assert data["status"] == "error"


class TestLoginEndpoint:
    """Tests for POST /auth/login."""

    def test_login_returns_200(self, client):
        """A valid login request should return HTTP 200."""
        client.post("/auth/add_user", json={"username": "testuser", "password": "testpass123"})
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass123",
        })
        assert resp.status_code == 200

    def test_login_returns_json(self, client):
        """The response should be valid JSON."""
        client.post("/auth/add_user", json={"username": "testuser", "password": "testpass123"})
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass123",
        })
        data = resp.get_json()
        assert data is not None

    def test_login_has_status_ok(self, client):
        """The JSON body should contain status == 'ok'."""
        client.post("/auth/add_user", json={"username": "testuser", "password": "testpass123"})
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass123",
        })
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_login_message_contains_username(self, client):
        """The response message should echo back the submitted username."""
        client.post("/auth/add_user", json={"username": "alice", "password": "s3cret"})
        resp = client.post("/auth/login", json={
            "username": "alice",
            "password": "s3cret",
        })
        data = resp.get_json()
        assert "alice" in data["message"]

    def test_login_wrong_method_returns_405(self, client):
        """GET requests to /auth/login should be rejected with 405."""
        resp = client.get("/auth/login")
        assert resp.status_code == 405

    def test_login_content_type_is_json(self, client):
        """Response Content-Type should be application/json."""
        client.post("/auth/add_user", json={"username": "testuser", "password": "pass"})
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "pass",
        })
        assert resp.content_type == "application/json"

    def test_login_missing_username_returns_400(self, client):
        """Omitting the username should return HTTP 400."""
        resp = client.post("/auth/login", json={
            "password": "somepass",
        })
        assert resp.status_code == 400

    def test_login_missing_password_returns_400(self, client):
        """Omitting the password should return HTTP 400."""
        resp = client.post("/auth/login", json={
            "username": "someuser",
        })
        assert resp.status_code == 400

    def test_login_empty_body_returns_400(self, client):
        """Sending an empty JSON body should return HTTP 400."""
        resp = client.post("/auth/login", json={})
        assert resp.status_code == 400

    def test_login_nonexistent_user_returns_404(self, client):
        """Login with an unregistered username should return HTTP 404."""
        resp = client.post("/auth/login", json={
            "username": "ghost",
            "password": "doesntmatter",
        })
        assert resp.status_code == 404

    def test_login_wrong_password_returns_401(self, client):
        """Login with incorrect password should return HTTP 401."""
        client.post("/auth/add_user", json={"username": "secure_user", "password": "correct"})
        resp = client.post("/auth/login", json={
            "username": "secure_user",
            "password": "wrong",
        })
        assert resp.status_code == 401

    def test_login_wrong_password_has_error_status(self, client):
        """Wrong password response should have status == 'error'."""
        client.post("/auth/add_user", json={"username": "user1", "password": "right"})
        resp = client.post("/auth/login", json={
            "username": "user1",
            "password": "wrong",
        })
        data = resp.get_json()
        assert data["status"] == "error"
