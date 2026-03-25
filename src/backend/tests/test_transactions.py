"""
Tests for the transactions blueprint (/transactions).
"""

import pytest

class TestCheckOut:
    def test_checkout_success(self, client, app):
        """Valid checkout should return 200 and allocate hardware."""
        app.db.users.insert_one({"username": "owner"})
        app.db.hardware.insert_one({"_id": "hw_1", "capacity": 100, "projects": {}})
        
        # Create project
        create_resp = client.post("/projects/create", json={"name": "Test", "owner": "owner"})
        pid = create_resp.get_json()["project_id"]

        resp = client.post("/transactions/check_out", json={
            "project_id": pid,
            "hw_id": "hw_1",
            "quantity": 50
        })
        
        assert resp.status_code == 200
        
        hw = app.db.hardware.find_one({"_id": "hw_1"})
        assert hw["projects"][pid] == 50

    def test_checkout_missing_fields(self, client):
        resp = client.post("/transactions/check_out", json={})
        assert resp.status_code == 400

    def test_checkout_invalid_quantity(self, client):
        resp = client.post("/transactions/check_out", json={
            "project_id": "pid1",
            "hw_id": "hw1",
            "quantity": -5
        })
        assert resp.status_code == 400

    def test_checkout_not_enough_capacity(self, client, app):
        app.db.users.insert_one({"username": "owner"})
        app.db.hardware.insert_one({"_id": "hw_1", "capacity": 10, "projects": {}})
        
        create_resp = client.post("/projects/create", json={"name": "Test", "owner": "owner"})
        pid = create_resp.get_json()["project_id"]

        resp = client.post("/transactions/check_out", json={
            "project_id": pid,
            "hw_id": "hw_1",
            "quantity": 20
        })
        assert resp.status_code == 400


class TestCheckIn:
    def test_checkin_success(self, client, app):
        """Valid checkin should return 200 and deallocate hardware."""
        app.db.users.insert_one({"username": "owner"})
        
        create_resp = client.post("/projects/create", json={"name": "Test", "owner": "owner"})
        pid = create_resp.get_json()["project_id"]

        app.db.hardware.insert_one({"_id": "hw_1", "capacity": 100, "projects": {pid: 50}})

        resp = client.post("/transactions/check_in", json={
            "project_id": pid,
            "hw_id": "hw_1",
            "quantity": 20
        })
        
        assert resp.status_code == 200
        
        hw = app.db.hardware.find_one({"_id": "hw_1"})
        assert hw["projects"][pid] == 30

    def test_checkin_missing_fields(self, client):
        resp = client.post("/transactions/check_in", json={})
        assert resp.status_code == 400

    def test_checkin_invalid_quantity(self, client):
        resp = client.post("/transactions/check_in", json={
            "project_id": "pid1",
            "hw_id": "hw1",
            "quantity": 0
        })
        assert resp.status_code == 400

    def test_checkin_more_than_held(self, client, app):
        app.db.users.insert_one({"username": "owner"})
        create_resp = client.post("/projects/create", json={"name": "Test", "owner": "owner"})
        pid = create_resp.get_json()["project_id"]

        app.db.hardware.insert_one({"_id": "hw_1", "capacity": 100, "projects": {pid: 10}})

        resp = client.post("/transactions/check_in", json={
            "project_id": pid,
            "hw_id": "hw_1",
            "quantity": 20
        })
        assert resp.status_code == 400
