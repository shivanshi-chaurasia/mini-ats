package com.ats.repository;

import com.ats.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long>, JpaSpecificationExecutor<Candidate> {

    @Query("SELECT c FROM Candidate c LEFT JOIN FETCH c.job WHERE c.id = :id")
    Optional<Candidate> findByIdWithJob(Long id);

    @Query("SELECT c.currentStage, COUNT(c) FROM Candidate c GROUP BY c.currentStage")
    List<Object[]> countGroupedByStage();

    @Query("SELECT c.source, COUNT(c) FROM Candidate c WHERE c.source IS NOT NULL GROUP BY c.source ORDER BY COUNT(c) DESC")
    List<Object[]> countGroupedBySource();

    @Query("SELECT j.title, COUNT(c) FROM Candidate c JOIN c.job j GROUP BY j.title ORDER BY COUNT(c) DESC")
    List<Object[]> countGroupedByJob();

    @Query("""
            SELECT CAST(c.createdAt AS date), COUNT(c)
            FROM Candidate c
            WHERE c.createdAt >= :from
            GROUP BY CAST(c.createdAt AS date)
            ORDER BY CAST(c.createdAt AS date)
            """)
    List<Object[]> countByDayAfter(@Param("from") LocalDateTime from);

    long countByJobId(Long jobId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
}
