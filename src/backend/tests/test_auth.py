"""
Tests for the auth blueprint (/auth).

Uses Flask's test client to send real HTTP requests to the login
and add_user endpoints and validates status codes, JSON structure,
and response content.
"""

import pytest


class TestLoginEndpoint:
    """Tests for POST /auth/login."""

    def test_login_returns_200(self, client):
        """A valid login request should return HTTP 200."""
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass123",
        })
        assert resp.status_code == 200

    def test_login_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass123",
        })
        data = resp.get_json()
        assert data is not None

    def test_login_has_status_ok(self, client):
        """The JSON body should contain status == 'ok'."""
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass123",
        })
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_login_message_contains_username(self, client):
        """The response message should echo back the submitted username."""
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
        resp = client.post("/auth/login", json={
            "username": "testuser",
            "password": "pass",
        })
        assert resp.content_type == "application/json"


class TestAddUserEndpoint:
    """Tests for POST /auth/add_user."""

    def test_add_user_returns_200(self, client):
        """A valid add_user request should return HTTP 200."""
        resp = client.post("/auth/add_user", json={
            "username": "newuser",
            "password": "newpass123",
        })
        assert resp.status_code == 200

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
