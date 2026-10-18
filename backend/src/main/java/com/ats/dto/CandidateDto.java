package com.ats.dto;

import com.ats.entity.HiringStage;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CandidateDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String skills;
    private Integer experienceYears;
    private String source;
    private String resumeUrl;
    private Long jobId;
    private String jobTitle;
    private HiringStage currentStage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
