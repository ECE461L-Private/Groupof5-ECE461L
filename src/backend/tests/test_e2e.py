"""
End-to-end integration tests for the HaaS backend.

These tests exercise multi-component flows that span multiple
blueprints, verifying that the different parts of the application
work together correctly.
"""

import pytest


class TestUserRegistrationLoginFlow:
    """E2E: user registers → logs in successfully."""

    def test_register_then_login_succeeds(self, client):
        """A newly registered user should be able to log in."""
        # Step 1: Register
        reg = client.post("/auth/add_user", json={
            "username": "e2e_user",
            "password": "e2e_pass",
        })
        assert reg.status_code == 201

        # Step 2: Login with same credentials
        login = client.post("/auth/login", json={
            "username": "e2e_user",
            "password": "e2e_pass",
        })
        assert login.status_code == 200
        data = login.get_json()
        assert data["status"] == "ok"
        assert "e2e_user" in data["message"]

    def test_register_then_login_wrong_password_fails(self, client):
        """Login after registration with wrong password should return 401."""
        client.post("/auth/add_user", json={
            "username": "pwd_test_user",
            "password": "correct_pw",
        })
        resp = client.post("/auth/login", json={
            "username": "pwd_test_user",
            "password": "wrong_pw",
        })
        assert resp.status_code == 401
        assert resp.get_json()["status"] == "error"

    def test_duplicate_registration_blocked(self, client):
        """Registering the same username twice should fail with 409."""
        client.post("/auth/add_user", json={
            "username": "taken_name",
            "password": "first_pass",
        })
        dup = client.post("/auth/add_user", json={
            "username": "taken_name",
            "password": "second_pass",
        })
        assert dup.status_code == 409
        assert dup.get_json()["status"] == "error"

    def test_login_before_registration_fails(self, client):
        """Cannot login without registering first."""
        resp = client.post("/auth/login", json={
            "username": "unregistered",
            "password": "nope",
        })
        assert resp.status_code == 404


class TestProjectLifecycleFlow:
    """E2E: create a project → get info → join project."""

    def test_create_then_get_info(self, client, app):
        """After creating a project, its info should be retrievable."""
        client.post("/auth/add_user", json={"username": "e2e_owner", "password": "pw"})
        # Step 1: Create
        create = client.post("/projects/create", json={
            "name": "E2E Project",
            "owner": "e2e_owner",
        })
        assert create.status_code == 201
        data = create.get_json()
        assert data["status"] == "ok"
        proj_id = data["project_id"]

        # Step 2: Get info (uses the dynamic project ID)
        info = client.get(f"/projects/get_project_info?project_id={proj_id}")
        assert info.status_code == 200
        assert info.get_json()["status"] == "ok"

    def test_create_then_join(self, client, app):
        """After creating a project, another user can join it."""
        client.post("/auth/add_user", json={"username": "owner_user", "password": "pw"})
        client.post("/auth/add_user", json={"username": "joiner_user", "password": "pw"})
        # Step 1: Create
        create = client.post("/projects/create", json={
            "name": "Team Project",
            "owner": "owner_user",
        })
        proj_id = create.get_json()["project_id"]

        # Step 2: Join
        join = client.post("/projects/join", json={
            "project_id": proj_id,
            "username": "joiner_user",
        })
        assert join.status_code == 200
        data = join.get_json()
        assert data["status"] == "ok"
        assert "joiner_user" in data["message"]

    def test_get_projects_for_user(self, client, app):
        """Should be able to list projects for a user."""
        client.post("/auth/add_user", json={"username": "e2e_owner", "password": "pw"})
        client.post("/projects/create", json={"name": "Team Project", "owner": "e2e_owner"})
        resp = client.get("/projects/get_projects?username=e2e_owner")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"


class TestHardwareTransactionFlow:
    """E2E: list hardware → check out → check in."""

    def test_list_then_checkout(self, client, app):
        """After listing hardware, a check_out should succeed."""
        client.post("/auth/add_user", json={"username": "hw_owner", "password": "pw"})
        create = client.post("/projects/create", json={"name": "Team Project", "owner": "hw_owner"})
        proj_id = create.get_json()["project_id"]

        # Step 1: List hardware
        hw_list = client.get("/hardware/list")
        assert hw_list.status_code == 200
        assert hw_list.get_json()["status"] == "ok"

        # Step 2: Check out from a hardware set
        checkout = client.post("/transactions/check_out", json={
            "project_id": proj_id,
            "hw_id": "hw_set_1",
            "quantity": 3,
        })
        assert checkout.status_code == 200
        data = checkout.get_json()
        assert data["status"] == "ok"
        assert "hw_set_1" in data["message"]
        assert "3" in data["message"]

    def test_checkout_then_checkin(self, client, app):
        """After checking out hardware, checking it back in should succeed."""
        client.post("/auth/add_user", json={"username": "hw_owner", "password": "pw"})
        client.get("/hardware/list") # Initialize database
        create = client.post("/projects/create", json={"name": "Team Project", "owner": "hw_owner"})
        proj_id = create.get_json()["project_id"]

        # Step 1: Check out
        client.post("/transactions/check_out", json={
            "project_id": proj_id,
            "hw_id": "hw_set_2",
            "quantity": 5,
        })

        # Step 2: Check in
        checkin = client.post("/transactions/check_in", json={
            "project_id": proj_id,
            "hw_id": "hw_set_2",
            "quantity": 5,
        })
        assert checkin.status_code == 200
        data = checkin.get_json()
        assert data["status"] == "ok"
        assert "hw_set_2" in data["message"]

    def test_get_hw_info_then_checkout(self, client, app):
        """Can view HW info and then check out from that HW set."""
        client.post("/auth/add_user", json={"username": "hw_owner", "password": "pw"})
        create = client.post("/projects/create", json={"name": "Team Project", "owner": "hw_owner"})
        proj_id = create.get_json()["project_id"]

        # Step 1: Get info
        info = client.get("/hardware/get_hw_info?hw_id=hw_set_1")
        assert info.status_code == 200
        assert "hw_set_1" in info.get_json()["message"]

        # Step 2: Check out
        checkout = client.post("/transactions/check_out", json={
            "project_id": proj_id,
            "hw_id": "hw_set_1",
            "quantity": 2,
        })
        assert checkout.status_code == 200


class TestFullAppFlow:
    """E2E: register → login → create project → check out → check in."""

    def test_complete_user_workflow(self, client, app):
        """Full happy-path workflow across all blueprints."""
        # 1. Register
        reg = client.post("/auth/add_user", json={
            "username": "fullflow_user",
            "password": "fullflow_pass",
        })

        # 2. Login
        login = client.post("/auth/login", json={
            "username": "fullflow_user",
            "password": "fullflow_pass",
        })
        assert login.status_code == 200

        # 3. Create project
        create = client.post("/projects/create", json={
            "name": "Full Flow Project",
            "owner": "fullflow_user",
        })
        assert create.status_code == 201
        proj_id = create.get_json()["project_id"]

        # 4. List hardware
        hw = client.get("/hardware/list")
        assert hw.status_code == 200

        # 5. Check out hardware for the project
        checkout = client.post("/transactions/check_out", json={
            "project_id": proj_id,
            "hw_id": "hw_set_1",
            "quantity": 10,
        })
        assert checkout.status_code == 200

        # 6. Check in hardware
        checkin = client.post("/transactions/check_in", json={
            "project_id": proj_id,
            "hw_id": "hw_set_1",
            "quantity": 10,
        })
        assert checkin.status_code == 200

        # 7. Get project info
        info = client.get(f"/projects/get_project_info?project_id={proj_id}")
        assert info.status_code == 200

    def test_health_check_accessible_throughout(self, client):
        """The root health check should always be accessible."""
        # Before any auth
        resp1 = client.get("/")
        assert resp1.status_code == 200

        # After some operations
        client.post("/auth/add_user", json={
            "username": "healthcheck_user",
            "password": "pass",
        })
        resp2 = client.get("/")
        assert resp2.status_code == 200
        assert resp2.get_json()["status"] == "ok"


class TestCrossBlueprintConsistency:
    """E2E: verify responses are consistently formatted across blueprints."""

    def test_all_endpoints_return_json(self, client, app):
        """Every endpoint should return application/json."""
        client.post("/auth/add_user", json={"username": "consistency_user", "password": "pass"})
        client.post("/auth/add_user", json={"username": "user1", "password": "pw"})
        client.post("/auth/add_user", json={"username": "O", "password": "pw"})
        client.post("/auth/add_user", json={"username": "u1", "password": "pw"})

        # Setup valid data to test against
        create = client.post("/projects/create", json={"name": "P", "owner": "O"})
        p1 = create.get_json()["project_id"]

        endpoints = [
            ("GET", "/"),
            ("GET", "/hardware/list"),
            ("GET", "/hardware/get_hw_info?hw_id=hw_set_1"),
            ("GET", "/projects/get_projects?username=user1"),
            ("GET", f"/projects/get_project_info?project_id={p1}"),
            ("POST", "/auth/login", {"username": "consistency_user", "password": "pass"}),
            ("POST", "/projects/create", {"name": "P2", "owner": "O"}),
            ("POST", "/projects/join", {"project_id": p1, "username": "u1"}),
            ("POST", "/transactions/check_out", {"project_id": p1, "hw_id": "hw_set_1", "quantity": 1}),
            ("POST", "/transactions/check_in", {"project_id": p1, "hw_id": "hw_set_1", "quantity": 1}),
        ]

        for entry in endpoints:
            method = entry[0]
            url = entry[1]
            json_body = entry[2] if len(entry) > 2 else None

            if method == "GET":
                resp = client.get(url)
            else:
                resp = client.post(url, json=json_body)

            assert resp.content_type == "application/json", f"{method} {url} did not return JSON"

    def test_all_success_responses_have_status_ok(self, client, app):
        """All successful responses should have status == 'ok'."""
        client.post("/auth/add_user", json={"username": "status_user", "password": "pass"})
        client.post("/auth/add_user", json={"username": "O", "password": "pw"})
        client.post("/auth/add_user", json={"username": "u", "password": "pw"})
        
        # Setup valid project
        create = client.post("/projects/create", json={"name": "P", "owner": "O"})
        p = create.get_json()["project_id"]

        endpoints = [
            ("GET", "/"),
            ("GET", "/hardware/list"),
            ("GET", "/projects/get_projects?username=u"),
            ("POST", "/auth/login", {"username": "status_user", "password": "pass"}),
            ("POST", "/transactions/check_out", {"project_id": p, "hw_id": "hw_set_1", "quantity": 1}),
        ]

        for entry in endpoints:
            method = entry[0]
            url = entry[1]
            json_body = entry[2] if len(entry) > 2 else None

            if method == "GET":
                resp = client.get(url)
            else:
                resp = client.post(url, json=json_body)

            data = resp.get_json()
            assert data["status"] == "ok", f"{method} {url} status was '{data['status']}', expected 'ok'"
