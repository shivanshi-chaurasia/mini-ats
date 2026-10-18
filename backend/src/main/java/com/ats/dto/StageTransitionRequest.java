package com.ats.dto;

import com.ats.entity.HiringStage;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StageTransitionRequest {

    @NotNull(message = "Target stage is required")
    private HiringStage targetStage;

    @Size(max = 100)
    private String changedBy;

    /** Optional. Used when backfilling history; defaults to now. */
    private LocalDateTime changedAt;
}
