
## Running the Flask backend locally

```bash
# 1. Navigate to the backend directory
cd src/backend

# 2. Create a virtual environment (first time only)
python3 -m venv venv

# 3. Activate the virtual environment
# macOS/Linux: source venv/bin/activate
# Windows: venv\Scripts\activate

# 4. Install dependencies (first time, or when requirements.txt changes)
pip install -r requirements.txt

# 5. Start the development server
python app.py
```

The API will be available at `http://127.0.0.1:5000`. Visit the root URL to confirm it's running.

To run the test suite:

```bash
cd src/backend
source venv/bin/activate
python -m pytest -v
```