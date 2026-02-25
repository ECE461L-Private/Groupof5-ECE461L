"""
Shared fixtures for the test suite.

Fixtures defined here are automatically available to every test file
under the tests/ directory — no import needed.
"""

import pytest


@pytest.fixture
def sample_project():
    """Return a basic project dict for use in tests."""
    return {
        "name": "HaaS Demo",
        "owner": "shaunak",
        "members": ["shaunak"],
        "hardware_sets": {},
    }
