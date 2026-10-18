package com.ats.dto;

import com.ats.entity.HiringStage;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StageHistoryDto {
    private Long id;
    private HiringStage fromStage;
    private HiringStage toStage;
    private LocalDateTime changedAt;
    private String changedBy;
}
