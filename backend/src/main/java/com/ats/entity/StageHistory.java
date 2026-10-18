package com.ats.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "stage_history", indexes = {
        @Index(name = "idx_history_candidate", columnList = "candidate_id"),
        @Index(name = "idx_history_changed_at", columnList = "changed_at")
})
@Getter
@Setter
public class StageHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Enumerated(EnumType.STRING)
    private HiringStage fromStage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HiringStage toStage;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    private String changedBy;
}
