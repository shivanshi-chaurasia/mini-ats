package com.ats.repository;

import com.ats.entity.HiringStage;
import com.ats.entity.StageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface StageHistoryRepository extends JpaRepository<StageHistory, Long> {

    List<StageHistory> findByCandidateIdOrderByChangedAtDesc(Long candidateId);

    @Query("SELECT COUNT(DISTINCT h.candidate.id) FROM StageHistory h WHERE h.toStage = :stage")
    long countCandidatesReaching(HiringStage stage);

    @Query("SELECT COUNT(h) FROM StageHistory h WHERE h.toStage = com.ats.entity.HiringStage.HIRED AND h.changedAt >= :since")
    long countHiresSince(LocalDateTime since);

    @Query("SELECT h.candidate.createdAt, h.changedAt FROM StageHistory h WHERE h.toStage = com.ats.entity.HiringStage.HIRED")
    List<Object[]> hireDates();
}
