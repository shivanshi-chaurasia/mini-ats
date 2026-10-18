#!/usr/bin/env python3
"""Export every candidate from the ATS API to a CSV file.

Usage: python export.py [base_url] [output_file]
"""

import csv
import sys
from client import login

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080/api/v1"
OUTPUT   = sys.argv[2] if len(sys.argv) > 2 else "candidates.csv"

FIELDS = ["id", "name", "email", "phone", "skills", "experienceYears",
          "source", "jobTitle", "currentStage", "resumeUrl", "createdAt"]


def fetch_all_candidates(api):
    candidates = []
    page, size = 0, 100
    while True:
        r = api.get(f"{BASE_URL}/candidates", timeout=30, params={"page": page, "size": size, "sortBy": "id", "sortDir": "asc"})
        r.raise_for_status()
        body = r.json()
        candidates.extend(body.get("content", []))
        if body.get("last", True) or not body.get("content"):
            break
        page += 1
    return candidates


def main():
    print(f"Fetching candidates from {BASE_URL}...")
    candidates = fetch_all_candidates(login(BASE_URL))
    print(f"Got {len(candidates)} candidates. Writing to {OUTPUT}...")

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(candidates)

    print(f"Done. {OUTPUT} written.")


if __name__ == "__main__":
    main()
