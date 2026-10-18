package com.ats.controller;

import com.ats.dto.JobDto;
import com.ats.dto.JobRequest;
import com.ats.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job opening management")
public class JobController {

    private final JobService jobService;

    @GetMapping
    @Operation(summary = "List all jobs")
    public ResponseEntity<List<JobDto>> getAll() {
        return ResponseEntity.ok(jobService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a job by ID")
    public ResponseEntity<JobDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a job opening")
    public ResponseEntity<JobDto> create(@Valid @RequestBody JobRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.create(req));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a job opening")
    public ResponseEntity<JobDto> update(@PathVariable Long id, @Valid @RequestBody JobRequest req) {
        return ResponseEntity.ok(jobService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a job opening")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        jobService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
