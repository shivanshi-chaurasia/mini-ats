#!/usr/bin/env python3
"""Seed the ATS through its REST API with jobs and ~60 candidates applied over the last 60 days.

Usage: python seed.py [base_url]
"""

import requests

from client import login
import random
import sys
from datetime import datetime, timedelta, timezone

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080/api/v1"

FIRST_NAMES = [
    "Aarav", "Aditya", "Akash", "Amit", "Ananya", "Anjali", "Arjun", "Deepak",
    "Divya", "Gaurav", "Ishaan", "Kavya", "Kiran", "Kunal", "Lakshmi", "Manish",
    "Meera", "Mohit", "Neha", "Nikhil", "Priya", "Rahul", "Rajesh", "Ravi",
    "Ritika", "Rohit", "Sangeeta", "Sanjay", "Shreya", "Siddharth", "Sneha",
    "Suresh", "Tanvi", "Varun", "Vikram", "Vivek", "Yash", "Zara"
]

LAST_NAMES = [
    "Agarwal", "Bhat", "Chakraborty", "Chauhan", "Chawla", "Deshpande", "Ghosh",
    "Gupta", "Iyer", "Jain", "Joshi", "Kapoor", "Kaur", "Kumar", "Mehta",
    "Mishra", "Nair", "Patel", "Pillai", "Rao", "Reddy", "Saxena", "Shah",
    "Sharma", "Singh", "Srivastava", "Tiwari", "Verma", "Yadav"
]

SKILLS_POOL = [
    ["Java", "Spring Boot", "MySQL", "Docker"],
    ["Python", "Django", "PostgreSQL", "Redis"],
    ["React", "TypeScript", "Node.js", "MongoDB"],
    ["Java", "Microservices", "Kafka", "Kubernetes"],
    ["Python", "FastAPI", "Machine Learning", "TensorFlow"],
    ["React", "Next.js", "GraphQL", "Tailwind"],
    ["Go", "gRPC", "Kubernetes", "AWS"],
    ["Angular", "Java", "Spring MVC", "Oracle"],
    ["Data Science", "Python", "Pandas", "Power BI"],
    ["DevOps", "CI/CD", "Terraform", "Jenkins"],
    ["Android", "Kotlin", "Jetpack Compose", "Firebase"],
    ["iOS", "Swift", "SwiftUI", "Xcode"],
    ["Full Stack", "Vue.js", "Laravel", "MySQL"],
    ["QA", "Selenium", "TestNG", "JMeter"],
    ["Data Engineering", "Spark", "Airflow", "Snowflake"],
]

SOURCES = ["LinkedIn", "Referral", "Job Board", "Company Website", "Naukri", "Campus"]
STAGE_ORDER = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"]

JOBS = [
    {"title": "Senior Backend Engineer", "department": "Engineering", "location": "Bangalore", "status": "OPEN"},
    {"title": "Frontend Developer", "department": "Engineering", "location": "Remote", "status": "OPEN"},
    {"title": "Data Scientist", "department": "Data", "location": "Hyderabad", "status": "OPEN"},
    {"title": "DevOps Engineer", "department": "Engineering", "location": "Pune", "status": "OPEN"},
    {"title": "Product Manager", "department": "Product", "location": "Mumbai", "status": "OPEN"},
    {"title": "Android Developer", "department": "Engineering", "location": "Delhi", "status": "CLOSED"},
]


api = None


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_or_create_jobs():
    existing = api.get(f"{BASE_URL}/jobs", timeout=15)
    existing.raise_for_status()
    if existing.json():
        print(f"Using {len(existing.json())} existing jobs")
        return [j["id"] for j in existing.json() if j["status"] == "OPEN"]

    job_ids = []
    for job in JOBS:
        r = api.post(f"{BASE_URL}/jobs", json=job, timeout=15)
        r.raise_for_status()
        if job["status"] == "OPEN":
            job_ids.append(r.json()["id"])
    print(f"Created {len(JOBS)} jobs")
    return job_ids


def create_candidate(job_id, applied_at):
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    for _ in range(5):
        email = f"{name.lower().replace(' ', '.')}.{random.randint(10, 999)}@example.com"
        payload = {
            "name": name,
            "email": email,
            "phone": f"+91 {random.randint(70000, 99999)}{random.randint(10000, 99999)}",
            "skills": ", ".join(random.choice(SKILLS_POOL)),
            "experienceYears": random.randint(0, 14),
            "source": random.choice(SOURCES),
            "resumeUrl": f"https://drive.google.com/file/d/sample_{random.randint(1000, 9999)}",
            "jobId": job_id,
            "appliedAt": applied_at.isoformat(timespec="seconds"),
        }
        r = api.post(f"{BASE_URL}/candidates", json=payload, timeout=15)
        if r.status_code == 201:
            return r.json()
        if r.status_code != 409:
            print(f"  candidate failed ({r.status_code}): {r.text[:100]}")
            return None
    return None


def move(candidate_id, stage, when):
    r = api.patch(
        f"{BASE_URL}/candidates/{candidate_id}/stage",
        json={"targetStage": stage, "changedBy": "seed script", "changedAt": when.isoformat(timespec="seconds")},
        timeout=15,
    )
    if r.status_code != 200:
        print(f"  stage move to {stage} failed: {r.text[:100]}")
    return r.status_code == 200


def walk_stages(candidate_id, applied_at, path):
    """Moves a candidate through each stage in path, a few days apart, never past now."""
    when = applied_at
    for stage in path:
        when = min(when + timedelta(hours=random.randint(10, 96)), utc_now() - timedelta(minutes=1))
        if not move(candidate_id, stage, when):
            return


def main():
    global api
    print(f"Seeding {BASE_URL}")
    api = login(BASE_URL)
    job_ids = get_or_create_jobs()
    if not job_ids:
        sys.exit("No open jobs available to attach candidates to")

    # (last stage reached, rejected afterwards)
    plan = (
        [("APPLIED", False)] * 15 + [("SCREENING", False)] * 12 + [("INTERVIEW", False)] * 10
        + [("OFFER", False)] * 6 + [("HIRED", False)] * 8
        + [("INTERVIEW", True)] * 5 + [("SCREENING", True)] * 4
    )
    random.shuffle(plan)

    created = 0
    for last_stage, rejected in plan:
        applied_at = utc_now() - timedelta(days=random.randint(0, 59), hours=random.randint(0, 23))
        candidate = create_candidate(random.choice(job_ids), applied_at)
        if not candidate:
            continue

        path = STAGE_ORDER[1:STAGE_ORDER.index(last_stage) + 1]
        if rejected:
            path.append("REJECTED")
        walk_stages(candidate["id"], applied_at, path)

        created += 1
        if created % 10 == 0:
            print(f"  {created}/{len(plan)}")

    print(f"Done. {created} candidates created.")


if __name__ == "__main__":
    main()
