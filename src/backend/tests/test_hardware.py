"""
Tests for hardware routes.
"""


class TestListHardware:
    def test_list_initializes_default_hardware_when_empty(self, client, auth_headers):
        resp = client.get("/hardware/list", headers=auth_headers("user", "pw123456"))
        data = resp.get_json()

        assert resp.status_code == 200
        assert data["status"] == "ok"
        assert data["message"] == "Successfully fetched 2 hardware sets"
        assert [item["hw_id"] for item in data["hardware"]] == ["hw_set_1", "hw_set_2"]

    def test_list_preserves_existing_hardware(self, client, app, auth_headers):
        app.db.hardware.insert_one(
            {"_id": "custom_hw", "name": "Custom", "capacity": 5, "available": 4, "projects": {"proj_1": 1}}
        )

        resp = client.get("/hardware/list", headers=auth_headers("user", "pw123456"))

        assert resp.status_code == 200
        assert resp.get_json()["hardware"] == [
            {
                "hw_id": "custom_hw",
                "name": "Custom",
                "capacity": 5,
                "available": 4,
                "allocations": {"proj_1": 1},
            }
        ]

    def test_list_post_not_allowed(self, client):
        assert client.post("/hardware/list").status_code == 405


class TestGetHardwareInfo:
    def test_get_hw_info_returns_requested_set(self, client, auth_headers):
        headers = auth_headers("user", "pw123456")
        client.get("/hardware/list", headers=headers)

        resp = client.get("/hardware/get_hw_info?hw_id=hw_set_1", headers=headers)
        data = resp.get_json()

        assert resp.status_code == 200
        assert data["status"] == "ok"
        assert "hw_set_1" in data["message"]
        assert data["hardware"]["name"] == "HWSet1"

    def test_get_hw_info_requires_hw_id(self, client, auth_headers):
        assert client.get("/hardware/get_hw_info", headers=auth_headers("user", "pw123456")).status_code == 400

    def test_get_hw_info_returns_404_for_missing_hardware(self, client, auth_headers):
        resp = client.get("/hardware/get_hw_info?hw_id=missing", headers=auth_headers("user", "pw123456"))
        assert resp.status_code == 404
        assert resp.get_json()["status"] == "error"

    def test_get_hw_info_post_not_allowed(self, client):
        assert client.post("/hardware/get_hw_info").status_code == 405
