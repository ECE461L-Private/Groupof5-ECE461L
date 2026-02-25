# How to Run Tests

## Setup (first time only)

```bash
cd src/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Activate the virtual environment

```bash
cd src/backend
source venv/bin/activate
```

## Run all tests

```bash
python -m pytest
```

## Run tests with verbose output (shows each test name)

```bash
python -m pytest -v
```

## Run tests with code coverage report

```bash
python -m pytest --cov=app --cov-report=term-missing
```

## Run a specific test file

```bash
python -m pytest tests/test_auth.py
python -m pytest tests/test_projects.py
```

## Run a specific test by name

```bash
python -m pytest -k "test_checkout_basic"
```
