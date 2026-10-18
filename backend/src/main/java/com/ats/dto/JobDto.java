package com.ats.dto;

import com.ats.entity.JobStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class JobDto {
    private Long id;
    private String title;
    private String department;
    private String location;
    private JobStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long candidateCount;
}
