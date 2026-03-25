"""
Tests for the Flask application root and factory.

Validates that the app factory creates a working application,
the health-check route is accessible, and blueprint registration works.
"""

import pytest


class TestAppFactory:
    """Tests for create_app() and application-level behavior."""

    def test_app_is_created(self, app):
        """create_app() should return a Flask application instance."""
        from flask import Flask
        assert isinstance(app, Flask)

    def test_app_is_in_testing_mode(self, app):
        """The TESTING config flag should be True in our fixture."""
        assert app.config["TESTING"] is True

    def test_client_is_usable(self, client):
        """The test client fixture should be ready to make requests."""
        assert client is not None


class TestHealthCheck:
    """Tests for GET / (the root health-check route)."""

    def test_root_returns_200(self, client):
        """The health-check route should return HTTP 200."""
        resp = client.get("/")
        assert resp.status_code == 200

    def test_root_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.get("/")
        data = resp.get_json()
        assert data is not None

    def test_root_status_is_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.get("/")
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_root_has_message(self, client):
        """JSON body should contain a 'message' key."""
        resp = client.get("/")
        data = resp.get_json()
        assert "message" in data

    def test_root_message_is_hello_world(self, client):
        """The message should be 'Hello, World!'."""
        resp = client.get("/")
        data = resp.get_json()
        assert data["message"] == "Hello, World!"

    def test_root_content_type(self, client):
        """Response Content-Type should be application/json."""
        resp = client.get("/")
        assert resp.content_type == "application/json"

    def test_root_post_not_allowed(self, client):
        """POST to the root route should return HTTP 405."""
        resp = client.post("/")
        assert resp.status_code == 405


class TestBlueprintRegistration:
    """Tests that all expected blueprints are registered."""

    def test_auth_blueprint_registered(self, app):
        """The 'auth' blueprint should be registered."""
        assert "auth" in app.blueprints

    def test_projects_blueprint_registered(self, app):
        """The 'projects' blueprint should be registered."""
        assert "projects" in app.blueprints

    def test_hardware_blueprint_registered(self, app):
        """The 'hardware' blueprint should be registered."""
        assert "hardware" in app.blueprints

    def test_transactions_blueprint_registered(self, app):
        """The 'transactions' blueprint should be registered."""
        assert "transactions" in app.blueprints


class TestNonexistentRoutes:
    """Tests for routes that do not exist — ensures proper 404 handling."""

    def test_unknown_route_returns_404(self, client):
        """A request to a nonexistent route should return 404."""
        resp = client.get("/this-route-does-not-exist")
        assert resp.status_code == 404

    def test_unknown_api_route_returns_404(self, client):
        """A request to a fake API path should return 404."""
        resp = client.get("/auth/nonexistent")
        assert resp.status_code == 404
