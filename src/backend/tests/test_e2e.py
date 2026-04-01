"""
End-to-end backend flows that exercise multiple blueprints together.
"""

import datetime


class TestUserProjectHardwareLifecycle:
    def test_full_workflow_register_login_project_hardware_and_logs(self, client):
        owner = client.post("/auth/add_user", json={"username": "owner", "password": "pass12345"})
        member = client.post("/auth/add_user", json={"username": "member", "password": "pass12345"})

        owner_headers = {"Authorization": f"Bearer {owner.get_json()['access_token']}"}
        member_headers = {"Authorization": f"Bearer {member.get_json()['access_token']}"}

        project_id = client.post("/projects/create", json={"name": "Full Flow"}, headers=owner_headers).get_json()["project_id"]
        client.post("/projects/join", json={"project_id": project_id}, headers=member_headers)

        hardware = client.get("/hardware/list", headers=owner_headers).get_json()["hardware"]
        hw_id = hardware[0]["hw_id"]

        checkout = client.post(
            "/transactions/check_out",
            json={"project_id": project_id, "hw_id": hw_id, "quantity": 3},
            headers=owner_headers,
        )
        checkin = client.post(
            "/transactions/check_in",
            json={"project_id": project_id, "hw_id": hw_id, "quantity": 1},
            headers=owner_headers,
        )
        client.post("/logs/add", json={"message": "Checked hardware"}, headers=owner_headers)

        project_info = client.get(f"/projects/get_project_info?project_id={project_id}", headers=owner_headers)
        profile = client.get("/auth/me", headers=owner_headers)
        logs = client.get("/logs/list", headers=owner_headers)

        assert checkout.status_code == 200
        assert checkin.status_code == 200
        assert project_info.get_json()["project"]["members"] == ["owner", "member"]
        assert profile.get_json()["data"]["projects"] == [{"id": project_id, "name": "Full Flow"}]
        assert logs.get_json()["logs"][0]["msg"] == "Checked hardware"

    def test_owner_delete_cleans_up_project_and_memberships(self, client):
        owner = client.post("/auth/add_user", json={"username": "owner", "password": "pass12345"})
        member = client.post("/auth/add_user", json={"username": "member", "password": "pass12345"})
        owner_headers = {"Authorization": f"Bearer {owner.get_json()['access_token']}"}
        member_headers = {"Authorization": f"Bearer {member.get_json()['access_token']}"}

        project_id = client.post("/projects/create", json={"name": "Cleanup"}, headers=owner_headers).get_json()["project_id"]
        client.post("/projects/join", json={"project_id": project_id}, headers=member_headers)
        client.get("/hardware/list", headers=owner_headers)
        client.post(
            "/transactions/check_out",
            json={"project_id": project_id, "hw_id": "hw_set_1", "quantity": 2},
            headers=owner_headers,
        )

        delete_resp = client.delete("/projects/delete", json={"project_id": project_id}, headers=owner_headers)
        owner_projects = client.get("/projects/get_projects", headers=owner_headers).get_json()["projects"]
        member_projects = client.get("/projects/get_projects", headers=member_headers).get_json()["projects"]
        hardware = client.get("/hardware/get_hw_info?hw_id=hw_set_1", headers=owner_headers).get_json()["hardware"]

        assert delete_resp.status_code == 200
        assert owner_projects == []
        assert member_projects == []
        assert hardware["available"] == hardware["capacity"]
        assert hardware["allocations"] == {}


class TestErrorAndConsistencyFlows:
    def test_log_routes_handle_missing_message_and_order_recent_items(self, client, app, auth_headers):
        headers = auth_headers("logger", "pass12345")
        base_time = datetime.datetime(2026, 1, 1, 12, 0, 0)
        app.db.logs.insert_many(
            [
                {"username": "logger", "message": "older", "timestamp": base_time},
                {"username": "logger", "message": "newer", "timestamp": base_time + datetime.timedelta(minutes=1)},
                {"username": "other", "message": "ignored", "timestamp": base_time + datetime.timedelta(minutes=2)},
            ]
        )

        missing = client.post("/logs/add", json={}, headers=headers)
        logs = client.get("/logs/list", headers=headers).get_json()

        assert missing.status_code == 400
        assert logs["status"] == "ok"
        assert [entry["msg"] for entry in logs["logs"]] == ["newer", "older"]

    def test_every_successful_json_endpoint_returns_status_ok(self, client, auth_headers):
        headers = auth_headers("status_user", "pass12345")
        project_id = client.post("/projects/create", json={"name": "Status"}, headers=headers).get_json()["project_id"]
        client.get("/hardware/list", headers=headers)

        responses = [
            client.get("/", headers=headers),
            client.post("/auth/login", json={"username": "status_user", "password": "pass12345"}),
            client.get("/projects/get_projects", headers=headers),
            client.get(f"/projects/get_project_info?project_id={project_id}", headers=headers),
            client.get("/hardware/get_hw_info?hw_id=hw_set_1", headers=headers),
            client.post("/transactions/check_out", json={"project_id": project_id, "hw_id": "hw_set_1", "quantity": 1}, headers=headers),
            client.post("/transactions/check_in", json={"project_id": project_id, "hw_id": "hw_set_1", "quantity": 1}, headers=headers),
            client.post("/logs/add", json={"message": "hello"}, headers=headers),
            client.get("/logs/list", headers=headers),
            client.get("/auth/me", headers=headers),
        ]

        assert all(resp.content_type == "application/json" for resp in responses)
        assert all(resp.get_json()["status"] == "ok" for resp in responses)
