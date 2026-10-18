package com.ats.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CandidateRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name is too long")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email is too long")
    private String email;

    @Size(max = 30, message = "Phone is too long")
    private String phone;

    @Size(max = 1000, message = "Skills list is too long")
    private String skills;

    @Min(value = 0, message = "Experience cannot be negative")
    @Max(value = 60, message = "Experience looks too high")
    private Integer experienceYears;

    @Size(max = 100, message = "Source is too long")
    private String source;

    @Size(max = 500, message = "Resume URL is too long")
    @Pattern(regexp = "^(https?://.*)?$", message = "Resume URL must start with http:// or https://")
    private String resumeUrl;

    private Long jobId;

    /** Optional. Lets imports and seed scripts backdate the application. */
    private LocalDateTime appliedAt;
}
