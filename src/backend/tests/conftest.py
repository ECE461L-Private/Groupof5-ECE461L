"""
Shared fixtures and lightweight in-memory Mongo doubles for backend tests.
"""

import copy
import os
import sys
from unittest.mock import patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app


def _get_nested(doc, dotted_key):
    current = doc
    for part in dotted_key.split("."):
        if not isinstance(current, dict) or part not in current:
            return None, False
        current = current[part]
    return current, True


def _set_nested(doc, dotted_key, value):
    current = doc
    parts = dotted_key.split(".")
    for part in parts[:-1]:
        current = current.setdefault(part, {})
    current[parts[-1]] = value


def _delete_nested(doc, dotted_key):
    current = doc
    parts = dotted_key.split(".")
    for part in parts[:-1]:
        current = current.get(part)
        if not isinstance(current, dict):
            return
    if isinstance(current, dict):
        current.pop(parts[-1], None)


def _matches(doc, query):
    if not query:
        return True

    for key, expected in query.items():
        actual, exists = _get_nested(doc, key)

        if isinstance(expected, dict):
            if "$in" in expected and actual not in expected["$in"]:
                return False
            if "$exists" in expected and exists is not expected["$exists"]:
                return False
            continue

        if not exists or actual != expected:
            return False

    return True


class MockCursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, key, direction):
        reverse = direction == -1
        self.docs.sort(key=lambda doc: _get_nested(doc, key)[0], reverse=reverse)
        return self

    def limit(self, count):
        self.docs = self.docs[:count]
        return self

    def __iter__(self):
        return iter(self.docs)


class MockCollection:
    def __init__(self):
        self.data = []

    def find_one(self, query):
        for doc in self.data:
            if _matches(doc, query):
                return doc
        return None

    def find(self, query):
        return MockCursor([doc for doc in self.data if _matches(doc, query)])

    def insert_one(self, doc):
        import uuid

        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())

        self.data.append(copy.deepcopy(doc))

        class InsertOneResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id

        return InsertOneResult(doc["_id"])

    def insert_many(self, docs):
        for doc in docs:
            self.data.append(copy.deepcopy(doc))

    def count_documents(self, query):
        return len(list(self.find(query)))

    def update_one(self, query, update):
        target = self.find_one(query)
        if target is None:
            return
        self._apply_update(target, update)

    def update_many(self, query, update):
        for doc in self.data:
            if _matches(doc, query):
                self._apply_update(doc, update)

    def delete_one(self, query):
        for index, doc in enumerate(self.data):
            if _matches(doc, query):
                del self.data[index]
                return

    def _apply_update(self, target, update):
        for key, value in update.get("$addToSet", {}).items():
            current, exists = _get_nested(target, key)
            if not exists:
                _set_nested(target, key, [])
                current = _get_nested(target, key)[0]
            if isinstance(current, list) and value not in current:
                current.append(value)

        for key, amount in update.get("$inc", {}).items():
            current, exists = _get_nested(target, key)
            _set_nested(target, key, (current if exists else 0) + amount)

        for key, value in update.get("$pull", {}).items():
            current, exists = _get_nested(target, key)
            if exists and isinstance(current, list):
                _set_nested(target, key, [item for item in current if item != value])

        for key in update.get("$unset", {}):
            _delete_nested(target, key)

        for key, value in update.get("$set", {}).items():
            _set_nested(target, key, value)


class MockDB:
    def __init__(self):
        self.users = MockCollection()
        self.projects = MockCollection()
        self.hardware = MockCollection()
        self.logs = MockCollection()


@pytest.fixture
def app():
    with patch("app.MongoClient"):
        app = create_app()
        app.config["TESTING"] = True
        app.db = MockDB()
        yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    def _register_and_auth(username="tester", password="secret123"):
        response = client.post(
            "/auth/add_user",
            json={"username": username, "password": password},
        )
        token = response.get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _register_and_auth
