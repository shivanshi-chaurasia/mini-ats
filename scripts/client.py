import os
import sys

import requests


def login(base_url):
    """Returns a session that sends the bearer token on every request."""
    email = os.environ.get("ATS_EMAIL", "admin@miniats.com")
    password = os.environ.get("ATS_PASSWORD", "Admin@123")
    r = requests.post(f"{base_url}/auth/login", json={"email": email, "password": password}, timeout=15)
    if r.status_code != 200:
        sys.exit(f"Login failed ({r.status_code}). Set ATS_EMAIL and ATS_PASSWORD to a valid account.")
    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {r.json()['token']}"
    return session
