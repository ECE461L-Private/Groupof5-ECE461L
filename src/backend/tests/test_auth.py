"""
Tests for auth routes, including profile lookup for authenticated users.
"""


class TestAddUserEndpoint:
    def test_add_user_returns_access_token(self, client):
        resp = client.post("/auth/add_user", json={"username": "newuser", "password": "newpass123"})

        assert resp.status_code == 201
        assert resp.content_type == "application/json"
        assert set(resp.get_json().keys()) == {"status", "message", "access_token"}

    def test_add_user_missing_username_returns_400(self, client):
        resp = client.post("/auth/add_user", json={"password": "somepass"})
        assert resp.status_code == 400

    def test_add_user_missing_password_returns_400(self, client):
        resp = client.post("/auth/add_user", json={"username": "someuser"})
        assert resp.status_code == 400

    def test_add_user_duplicate_returns_409(self, client):
        client.post("/auth/add_user", json={"username": "duplicate", "password": "pass1"})

        resp = client.post("/auth/add_user", json={"username": "duplicate", "password": "pass2"})

        assert resp.status_code == 409
        assert resp.get_json()["status"] == "error"

    def test_add_user_wrong_method_returns_405(self, client):
        assert client.get("/auth/add_user").status_code == 405


class TestLoginEndpoint:
    def test_login_returns_access_token(self, client):
        client.post("/auth/add_user", json={"username": "testuser", "password": "testpass123"})

        resp = client.post("/auth/login", json={"username": "testuser", "password": "testpass123"})

        assert resp.status_code == 200
        assert resp.content_type == "application/json"
        assert set(resp.get_json().keys()) == {"status", "message", "access_token"}

    def test_login_missing_username_returns_400(self, client):
        assert client.post("/auth/login", json={"password": "somepass"}).status_code == 400

    def test_login_missing_password_returns_400(self, client):
        assert client.post("/auth/login", json={"username": "someuser"}).status_code == 400

    def test_login_nonexistent_user_returns_404(self, client):
        assert client.post("/auth/login", json={"username": "ghost", "password": "nope"}).status_code == 404

    def test_login_wrong_password_returns_401(self, client):
        client.post("/auth/add_user", json={"username": "secure_user", "password": "correct"})

        resp = client.post("/auth/login", json={"username": "secure_user", "password": "wrong"})

        assert resp.status_code == 401
        assert resp.get_json()["status"] == "error"

    def test_login_wrong_method_returns_405(self, client):
        assert client.get("/auth/login").status_code == 405


class TestMeEndpoint:
    def test_me_returns_profile_with_projects_and_usage(self, client, app, auth_headers):
        headers = auth_headers("alice", "pw123456")
        app.db.projects.insert_one({"_id": "proj_1", "name": "Alpha", "owner": "alice", "members": ["alice"]})
        app.db.users.update_one({"username": "alice"}, {"$set": {"projects": ["proj_1"]}})
        app.db.hardware.insert_one(
            {
                "_id": "hw_1",
                "name": "HW Set",
                "capacity": 10,
                "available": 7,
                "projects": {"proj_1": 3},
            }
        )

        resp = client.get("/auth/me", headers=headers)
        data = resp.get_json()

        assert resp.status_code == 200
        assert data["status"] == "ok"
        assert data["data"]["username"] == "alice"
        assert data["data"]["projects"] == [{"id": "proj_1", "name": "Alpha"}]
        assert data["data"]["usage"] == [{"project_name": "Alpha", "units": 3}]

    def test_me_returns_404_for_deleted_user(self, client, app, auth_headers):
        headers = auth_headers("gone", "pw123456")
        app.db.users.delete_one({"username": "gone"})

        resp = client.get("/auth/me", headers=headers)

        assert resp.status_code == 404
        assert resp.get_json()["message"] == "User not found"
