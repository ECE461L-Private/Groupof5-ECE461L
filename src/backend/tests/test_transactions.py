"""
Tests for transaction routes.
"""


class TestCheckOut:
    def test_checkout_success_updates_allocations_and_availability(self, client, app, auth_headers):
        headers = auth_headers("owner", "pw123456")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]
        app.db.hardware.insert_one({"_id": "hw_1", "name": "Kit", "capacity": 100, "available": 100, "projects": {}})

        resp = client.post(
            "/transactions/check_out",
            json={"project_id": project_id, "hw_id": "hw_1", "quantity": 50},
            headers=headers,
        )

        assert resp.status_code == 200
        hw = app.db.hardware.find_one({"_id": "hw_1"})
        assert hw["projects"][project_id] == 50
        assert hw["available"] == 50

    def test_checkout_missing_fields(self, client, auth_headers):
        assert client.post("/transactions/check_out", json={}, headers=auth_headers("owner", "pw123456")).status_code == 400

    def test_checkout_invalid_quantity(self, client, auth_headers):
        resp = client.post(
            "/transactions/check_out",
            json={"project_id": "pid1", "hw_id": "hw1", "quantity": -5},
            headers=auth_headers("owner", "pw123456"),
        )
        assert resp.status_code == 400

    def test_checkout_missing_project_returns_404(self, client, app, auth_headers):
        headers = auth_headers("owner", "pw123456")
        app.db.hardware.insert_one({"_id": "hw_1", "name": "Kit", "capacity": 10, "available": 10, "projects": {}})

        resp = client.post(
            "/transactions/check_out",
            json={"project_id": "missing", "hw_id": "hw_1", "quantity": 1},
            headers=headers,
        )

        assert resp.status_code == 404

    def test_checkout_missing_hardware_returns_404(self, client, auth_headers):
        headers = auth_headers("owner", "pw123456")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]

        resp = client.post(
            "/transactions/check_out",
            json={"project_id": project_id, "hw_id": "missing", "quantity": 1},
            headers=headers,
        )

        assert resp.status_code == 404

    def test_checkout_not_enough_capacity(self, client, app, auth_headers):
        headers = auth_headers("owner", "pw123456")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]
        app.db.hardware.insert_one({"_id": "hw_1", "name": "Kit", "capacity": 10, "available": 10, "projects": {}})

        resp = client.post(
            "/transactions/check_out",
            json={"project_id": project_id, "hw_id": "hw_1", "quantity": 20},
            headers=headers,
        )

        assert resp.status_code == 400


class TestCheckIn:
    def test_checkin_success_updates_allocations_and_availability(self, client, app, auth_headers):
        headers = auth_headers("owner", "pw123456")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]
        app.db.hardware.insert_one(
            {"_id": "hw_1", "name": "Kit", "capacity": 100, "available": 50, "projects": {project_id: 50}}
        )

        resp = client.post(
            "/transactions/check_in",
            json={"project_id": project_id, "hw_id": "hw_1", "quantity": 20},
            headers=headers,
        )

        assert resp.status_code == 200
        hw = app.db.hardware.find_one({"_id": "hw_1"})
        assert hw["projects"][project_id] == 30
        assert hw["available"] == 70

    def test_checkin_missing_fields(self, client, auth_headers):
        assert client.post("/transactions/check_in", json={}, headers=auth_headers("owner", "pw123456")).status_code == 400

    def test_checkin_invalid_quantity(self, client, auth_headers):
        resp = client.post(
            "/transactions/check_in",
            json={"project_id": "pid1", "hw_id": "hw1", "quantity": 0},
            headers=auth_headers("owner", "pw123456"),
        )
        assert resp.status_code == 400

    def test_checkin_missing_hardware_returns_404(self, client, auth_headers):
        resp = client.post(
            "/transactions/check_in",
            json={"project_id": "pid1", "hw_id": "missing", "quantity": 1},
            headers=auth_headers("owner", "pw123456"),
        )
        assert resp.status_code == 404

    def test_checkin_more_than_held(self, client, app, auth_headers):
        headers = auth_headers("owner", "pw123456")
        project_id = client.post("/projects/create", json={"name": "Test"}, headers=headers).get_json()["project_id"]
        app.db.hardware.insert_one(
            {"_id": "hw_1", "name": "Kit", "capacity": 100, "available": 90, "projects": {project_id: 10}}
        )

        resp = client.post(
            "/transactions/check_in",
            json={"project_id": project_id, "hw_id": "hw_1", "quantity": 20},
            headers=headers,
        )

        assert resp.status_code == 400
