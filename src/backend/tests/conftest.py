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


@pytest.fixture
def app():
    """Create the Flask application in testing mode."""
    app = create_app()
    app.config["TESTING"] = True
    return app


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
