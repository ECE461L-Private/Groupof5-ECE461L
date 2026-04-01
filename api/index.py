import os
import sys

ROOT = os.path.dirname(os.path.dirname(__file__))
BACKEND_ROOT = os.path.join(ROOT, "src", "backend")

if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import create_app

app = create_app()
