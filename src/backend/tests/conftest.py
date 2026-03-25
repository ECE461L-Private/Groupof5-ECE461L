"""
Shared fixtures for the test suite.

Fixtures defined here are automatically available to every test file
under the tests/ directory — no import needed.
"""

import sys
import os
import pytest

# Ensure the backend root is on sys.path so `from routes.xxx` imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app


from unittest.mock import patch
import copy

class MockCollection:
    def __init__(self):
        self.data = []

    def find_one(self, query):
        for doc in self.data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    def find(self, query):
        if not query:
            return self.data.copy()
            
        results = []
        # Support for {"_id": {"$in": [...]}} queries
        for doc in self.data:
            match = True
            for k, v in query.items():
                if isinstance(v, dict) and "$in" in v:
                    if doc.get(k) not in v["$in"]:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc)
        return results

    def insert_one(self, doc):
        import uuid
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        
        # We need to append a deepcopy to our data store, 
        # but PyMongo natively mutates the passed-in `doc` object to add `_id`.
        # So we leave the `_id` in `doc` for the caller to use.
        self.data.append(copy.deepcopy(doc))
        
        # Return a mock result object that has an inserted_id attribute
        class InsertOneResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertOneResult(doc["_id"])

    def insert_many(self, docs):
        for doc in docs:
            self.data.append(copy.deepcopy(doc))

    def count_documents(self, query):
        return len(self.find(query))

    def update_one(self, query, update):
        target = self.find_one(query)
        if not target:
            return
            
        # apply $addToSet
        if "$addToSet" in update:
            for k, v in update["$addToSet"].items():
                if k not in target:
                    target[k] = []
                if isinstance(target[k], list) and v not in target[k]:
                    target[k].append(v)
                    
        # apply $inc (used for hardware allocations)
        if "$inc" in update:
            for k, amount in update["$inc"].items():
                # k is like "projects.proj_123"
                parts = k.split(".")
                curr = target
                for i, part in enumerate(parts):
                    if i == len(parts) - 1:
                        # end of path
                        curr[part] = curr.get(part, 0) + amount
                    else:
                        if part not in curr:
                            curr[part] = {}
                        curr = curr[part]

class MockDB:
    def __init__(self):
        self.users = MockCollection()
        self.projects = MockCollection()
        self.hardware = MockCollection()

@pytest.fixture
def app():
    """Create the Flask application in testing mode."""
    with patch("app.MongoClient"):
        app = create_app()
        app.config["TESTING"] = True
        app.db = MockDB()
        yield app


@pytest.fixture
def client(app):
    """A Flask test client for sending requests without running the server."""
    return app.test_client()


@pytest.fixture
def sample_project():
    """Return a basic project dict for use in tests."""
    return {
        "name": "HaaS Demo",
        "owner": "shaunak",
        "members": ["shaunak"],
        "hardware_sets": {},
    }
