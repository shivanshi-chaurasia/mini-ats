package com.ats.controller;

import com.ats.dto.*;
import com.ats.entity.HiringStage;
import com.ats.service.CandidateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidates", description = "Candidate management and pipeline")
public class CandidateController {

    private final CandidateService candidateService;

    @GetMapping
    @Operation(summary = "Search/filter candidates with pagination")
    public ResponseEntity<PagedResponse<CandidateDto>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) HiringStage stage,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Integer minExp,
            @RequestParam(required = false) Integer maxExp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(
                candidateService.search(keyword, stage, jobId, source, minExp, maxExp, page, size, sortBy, sortDir)
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a candidate by ID")
    public ResponseEntity<CandidateDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new candidate")
    public ResponseEntity<CandidateDto> create(@Valid @RequestBody CandidateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.create(req));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update candidate details")
    public ResponseEntity<CandidateDto> update(@PathVariable Long id, @Valid @RequestBody CandidateRequest req) {
        return ResponseEntity.ok(candidateService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a candidate")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        candidateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stage")
    @Operation(summary = "Move candidate to next hiring stage")
    public ResponseEntity<CandidateDto> moveStage(
            @PathVariable Long id,
            @Valid @RequestBody StageTransitionRequest req) {
        return ResponseEntity.ok(candidateService.moveStage(id, req));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get stage transition history for a candidate")
    public ResponseEntity<List<StageHistoryDto>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getStageHistory(id));
    }

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add a recruiter note to a candidate")
    public ResponseEntity<NoteDto> addNote(@PathVariable Long id, @Valid @RequestBody NoteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addNote(id, req));
    }

    @GetMapping("/{id}/notes")
    @Operation(summary = "Get all notes for a candidate")
    public ResponseEntity<List<NoteDto>> getNotes(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getNotes(id));
    }
}
