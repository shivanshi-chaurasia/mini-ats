package com.ats.dto;

import com.ats.entity.JobStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JobRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title is too long")
    private String title;

    @NotBlank(message = "Department is required")
    @Size(max = 100, message = "Department is too long")
    private String department;

    @NotBlank(message = "Location is required")
    @Size(max = 100, message = "Location is too long")
    private String location;

    @NotNull(message = "Status is required")
    private JobStatus status;
}
