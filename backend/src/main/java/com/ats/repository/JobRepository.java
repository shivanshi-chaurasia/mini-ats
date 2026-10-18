package com.ats.repository;

import com.ats.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("SELECT c.job.id, COUNT(c) FROM Candidate c WHERE c.job IS NOT NULL GROUP BY c.job.id")
    List<Object[]> countCandidatesPerJob();
}
