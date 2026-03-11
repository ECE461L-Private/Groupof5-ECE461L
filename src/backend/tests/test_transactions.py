"""
Tests for the transactions blueprint (/transactions).

Uses Flask's test client to send real HTTP requests to the check_out
and check_in endpoints and validates status codes, JSON structure,
and response content.
"""

import pytest


class TestCheckOut:
    """Tests for POST /transactions/check_out."""

    def test_check_out_returns_200(self, client):
        """A valid check_out request should return HTTP 200."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 5,
        })
        assert resp.status_code == 200

    def test_check_out_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 3,
        })
        data = resp.get_json()
        assert data is not None

    def test_check_out_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 2,
        })
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_check_out_message_contains_hw_id(self, client):
        """Response message should echo the hw_id."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_001",
            "hw_id": "sensor_A",
            "quantity": 1,
        })
        data = resp.get_json()
        assert "sensor_A" in data["message"]

    def test_check_out_message_contains_project_id(self, client):
        """Response message should echo the project_id."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_xyz",
            "hw_id": "hw_set_1",
            "quantity": 1,
        })
        data = resp.get_json()
        assert "proj_xyz" in data["message"]

    def test_check_out_message_contains_quantity(self, client):
        """Response message should echo the quantity."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 7,
        })
        data = resp.get_json()
        assert "7" in data["message"]

    def test_check_out_response_keys(self, client):
        """Response JSON should contain exactly 'status' and 'message'."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 1,
        })
        data = resp.get_json()
        assert set(data.keys()) == {"status", "message"}

    def test_check_out_content_type(self, client):
        """Response Content-Type should be application/json."""
        resp = client.post("/transactions/check_out", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 1,
        })
        assert resp.content_type == "application/json"

    def test_check_out_get_not_allowed(self, client):
        """GET to /transactions/check_out should return 405."""
        resp = client.get("/transactions/check_out")
        assert resp.status_code == 405


class TestCheckIn:
    """Tests for POST /transactions/check_in."""

    def test_check_in_returns_200(self, client):
        """A valid check_in request should return HTTP 200."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 3,
        })
        assert resp.status_code == 200

    def test_check_in_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 2,
        })
        data = resp.get_json()
        assert data is not None

    def test_check_in_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 1,
        })
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_check_in_message_contains_hw_id(self, client):
        """Response message should echo the hw_id."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_001",
            "hw_id": "actuator_B",
            "quantity": 1,
        })
        data = resp.get_json()
        assert "actuator_B" in data["message"]

    def test_check_in_message_contains_project_id(self, client):
        """Response message should echo the project_id."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_abc",
            "hw_id": "hw_set_1",
            "quantity": 1,
        })
        data = resp.get_json()
        assert "proj_abc" in data["message"]

    def test_check_in_message_contains_quantity(self, client):
        """Response message should echo the quantity."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 4,
        })
        data = resp.get_json()
        assert "4" in data["message"]

    def test_check_in_response_keys(self, client):
        """Response JSON should contain exactly 'status' and 'message'."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 1,
        })
        data = resp.get_json()
        assert set(data.keys()) == {"status", "message"}

    def test_check_in_content_type(self, client):
        """Response Content-Type should be application/json."""
        resp = client.post("/transactions/check_in", json={
            "project_id": "proj_001",
            "hw_id": "hw_set_1",
            "quantity": 1,
        })
        assert resp.content_type == "application/json"

    def test_check_in_get_not_allowed(self, client):
        """GET to /transactions/check_in should return 405."""
        resp = client.get("/transactions/check_in")
        assert resp.status_code == 405
