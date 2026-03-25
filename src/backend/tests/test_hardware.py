"""
Tests for the hardware blueprint (/hardware).

Uses Flask's test client to send real HTTP requests to the hardware
endpoints and validates status codes, JSON structure, and content.
"""

import pytest


class TestListHardware:
    """Tests for GET /hardware/list."""

    def test_list_returns_200(self, client):
        """A valid request to list hardware should return HTTP 200."""
        resp = client.get("/hardware/list")
        assert resp.status_code == 200

    def test_list_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.get("/hardware/list")
        data = resp.get_json()
        assert data is not None

    def test_list_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.get("/hardware/list")
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_list_has_message(self, client):
        """JSON body should contain a 'message' key."""
        resp = client.get("/hardware/list")
        data = resp.get_json()
        assert "message" in data

    def test_list_response_keys(self, client):
        """Response JSON should contain exactly 'status', 'message', 'hardware'."""
        resp = client.get("/hardware/list")
        data = resp.get_json()
        assert set(data.keys()) == {"status", "message", "hardware"}

    def test_list_content_type_is_json(self, client):
        """Response Content-Type should be application/json."""
        resp = client.get("/hardware/list")
        assert resp.content_type == "application/json"

    def test_list_post_not_allowed(self, client):
        """POST to /hardware/list should return 405."""
        resp = client.post("/hardware/list")
        assert resp.status_code == 405


class TestGetHardwareInfo:
    """Tests for GET /hardware/get_hw_info."""

    def test_get_hw_info_returns_200(self, client):
        """A valid request should return HTTP 200."""
        resp = client.get("/hardware/get_hw_info?hw_id=hw_set_1")
        assert resp.status_code == 200

    def test_get_hw_info_returns_json(self, client):
        """The response should be valid JSON."""
        resp = client.get("/hardware/get_hw_info?hw_id=hw_set_1")
        data = resp.get_json()
        assert data is not None

    def test_get_hw_info_has_status_ok(self, client):
        """JSON body should contain status == 'ok'."""
        resp = client.get("/hardware/get_hw_info?hw_id=hw_set_1")
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_get_hw_info_message_contains_hw_id(self, client):
        """Response message should echo back the queried hw_id."""
        resp = client.get("/hardware/get_hw_info?hw_id=sensor_pack_A")
        data = resp.get_json()
        assert "sensor_pack_A" in data["message"]

    def test_get_hw_info_without_hw_id(self, client):
        """Calling without hw_id param returns 400."""
        resp = client.get("/hardware/get_hw_info")
        assert resp.status_code == 400

    def test_get_hw_info_response_keys(self, client):
        """Response JSON should contain exactly 'status', 'message', 'hardware'."""
        resp = client.get("/hardware/get_hw_info?hw_id=hw_set_1")
        data = resp.get_json()
        assert set(data.keys()) == {"status", "message", "hardware"}

    def test_get_hw_info_content_type(self, client):
        """Response Content-Type should be application/json."""
        resp = client.get("/hardware/get_hw_info?hw_id=hw_set_1")
        assert resp.content_type == "application/json"

    def test_get_hw_info_post_not_allowed(self, client):
        """POST to /hardware/get_hw_info should return 405."""
        resp = client.post("/hardware/get_hw_info")
        assert resp.status_code == 405
