# How to Run Tests

This project has two test suites: **backend** (Python/pytest) and **frontend** (React/Vitest + React Testing Library).

---

## Backend Tests (pytest)

### Setup (first time only)

```bash
cd src/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Activate the virtual environment

```bash
cd src/backend
source venv/bin/activate
```

### Run all tests

```bash
python -m pytest
```

### Run tests with verbose output (shows each test name)

```bash
python -m pytest -v
```

### Run tests with code coverage report

```bash
python -m pytest --cov=app --cov-report=term-missing
```

### Run a specific test file

```bash
python -m pytest tests/test_auth.py
python -m pytest tests/test_projects.py
python -m pytest tests/test_hardware.py
python -m pytest tests/test_app.py
```

### Run a specific test by name

```bash
python -m pytest -k "test_login_returns_200"
```

### Test file overview

| File | Description |
|------|-------------|
| `test_app.py` | App factory, health-check route, blueprint registration, 404 handling |
| `test_auth.py` | `/auth/login` and `/auth/add_user` endpoints |
| `test_hardware.py` | `/hardware/list` and `/hardware/get_hw_info` endpoints |
| `test_projects.py` | `/projects/create`, `/projects/join`, `/projects/get_projects`, `/projects/get_project_info` endpoints |

---

## Frontend Tests (Vitest + React Testing Library)

### Setup (first time only)

```bash
cd src/frontend
npm install
```

### Run all tests

```bash
cd src/frontend
npm test
```

### Run tests in watch mode (re-runs on file changes)

```bash
cd src/frontend
npx vitest
```

### Run a specific test file

```bash
npx vitest run src/Login.test.jsx
npx vitest run src/CreateAccount.test.jsx
npx vitest run src/App.test.jsx
```

### Run a specific test by name

```bash
npx vitest run -t "renders the login heading"
```

### Test file overview

| File | Description |
|------|-------------|
| `App.test.jsx` | Routing — redirect from `/`, correct pages at `/login` and `/create-account`, navigation links |
| `Login.test.jsx` | Login form rendering, input interactions, empty-field validation, successful submission |
| `CreateAccount.test.jsx` | Create account form rendering, input interactions, empty-field & password-mismatch validation, successful submission |
