package com.ats.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NoteRequest {

    @NotBlank(message = "Note content cannot be empty")
    @Size(max = 2000, message = "Note is too long")
    private String content;

    @Size(max = 100)
    private String createdBy;
}
