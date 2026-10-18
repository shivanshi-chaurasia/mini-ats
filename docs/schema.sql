-- Mini ATS schema (MySQL 8). docker-compose loads this on first start.
-- Elsewhere, run it once by hand or let Hibernate create the tables (ddl-auto=update).

CREATE DATABASE IF NOT EXISTS mini_ats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mini_ats;

CREATE TABLE IF NOT EXISTS jobs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    department  VARCHAR(100) NOT NULL,
    location    VARCHAR(100) NOT NULL,
    status      ENUM('OPEN','CLOSED','DRAFT') NOT NULL DEFAULT 'OPEN',
    created_at  DATETIME(6) NOT NULL,
    updated_at  DATETIME(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS candidates (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(30),
    skills           TEXT,
    experience_years INT,
    source           VARCHAR(100),
    resume_url       VARCHAR(512),
    job_id           BIGINT,
    current_stage    ENUM('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED') NOT NULL DEFAULT 'APPLIED',
    created_at       DATETIME(6) NOT NULL,
    updated_at       DATETIME(6),
    CONSTRAINT uk_candidate_email UNIQUE (email),
    CONSTRAINT fk_candidate_job FOREIGN KEY (job_id) REFERENCES jobs(id),
    INDEX idx_candidate_stage (current_stage),
    INDEX idx_candidate_job (job_id),
    INDEX idx_candidate_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stage_history (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    from_stage   ENUM('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED'),
    to_stage     ENUM('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED') NOT NULL,
    changed_at   DATETIME(6) NOT NULL,
    changed_by   VARCHAR(100),
    CONSTRAINT fk_history_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    INDEX idx_history_candidate (candidate_id),
    INDEX idx_history_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notes (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    content      TEXT NOT NULL,
    created_at   DATETIME(6) NOT NULL,
    created_by   VARCHAR(100),
    CONSTRAINT fk_notes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    INDEX idx_notes_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('ADMIN','RECRUITER') NOT NULL,
    created_at    DATETIME(6) NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB;
