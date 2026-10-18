package com.ats.service;

import com.ats.dto.*;
import com.ats.entity.*;
import com.ats.exception.ConflictException;
import com.ats.exception.ResourceNotFoundException;
import com.ats.repository.*;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final StageHistoryRepository historyRepo;
    private final NoteRepository noteRepo;

    private static final Set<String> SORTABLE = Set.of(
            "id", "name", "email", "experienceYears", "source", "currentStage", "createdAt");

    @Transactional(readOnly = true)
    public PagedResponse<CandidateDto> search(
            String keyword, HiringStage stage, Long jobId, String source,
            Integer minExp, Integer maxExp, int page, int size, String sortBy, String sortDir) {

        String sortField = SORTABLE.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortField).ascending()
                : Sort.by(sortField).descending();
        // secondary key keeps paging stable when many rows share the sort value
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort.and(Sort.by("id")));

        Specification<Candidate> spec = buildSpec(keyword, stage, jobId, source, minExp, maxExp);
        Page<Candidate> result = candidateRepo.findAll(spec, pageable);

        List<CandidateDto> dtos = result.getContent().stream().map(this::toDto).toList();
        return new PagedResponse<>(dtos, pageable.getPageNumber(), pageable.getPageSize(), result.getTotalElements());
    }

    private Specification<Candidate> buildSpec(
            String keyword, HiringStage stage, Long jobId,
            String source, Integer minExp, Integer maxExp) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("skills")), like)
                ));
            }
            if (stage != null) {
                predicates.add(cb.equal(root.get("currentStage"), stage));
            }
            if (jobId != null) {
                predicates.add(cb.equal(root.get("job").get("id"), jobId));
            }
            if (source != null && !source.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("source")), source.toLowerCase()));
            }
            if (minExp != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("experienceYears"), minExp));
            }
            if (maxExp != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("experienceYears"), maxExp));
            }

            // fetch the job in the same query for the page, but not for the count query
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("job", JoinType.LEFT);
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional(readOnly = true)
    public CandidateDto getById(Long id) {
        return candidateRepo.findByIdWithJob(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + id));
    }

    @Transactional
    public CandidateDto create(CandidateRequest req) {
        if (candidateRepo.existsByEmailIgnoreCase(req.getEmail().trim())) {
            throw new ConflictException("A candidate with this email already exists");
        }
        Candidate c = new Candidate();
        applyRequest(req, c);
        c.setCreatedAt(req.getAppliedAt());

        StageHistory initial = buildHistoryEntry(null, HiringStage.APPLIED, "system", req.getAppliedAt());
        initial.setCandidate(c);
        c.getStageHistory().add(initial);

        return toDto(candidateRepo.save(c));
    }

    @Transactional
    public CandidateDto update(Long id, CandidateRequest req) {
        Candidate c = candidateRepo.findByIdWithJob(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + id));
        if (candidateRepo.existsByEmailIgnoreCaseAndIdNot(req.getEmail().trim(), id)) {
            throw new ConflictException("A candidate with this email already exists");
        }
        applyRequest(req, c);
        return toDto(candidateRepo.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!candidateRepo.existsById(id)) {
            throw new ResourceNotFoundException("Candidate not found: " + id);
        }
        candidateRepo.deleteById(id);
    }

    @Transactional
    public CandidateDto moveStage(Long id, StageTransitionRequest req) {
        Candidate c = candidateRepo.findByIdWithJob(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + id));

        HiringStage from = c.getCurrentStage();
        HiringStage to = req.getTargetStage();

        StageTransitionValidator.validate(from, to);

        StageHistory history = buildHistoryEntry(from, to, req.getChangedBy(), req.getChangedAt());
        history.setCandidate(c);
        c.getStageHistory().add(history);
        c.setCurrentStage(to);

        return toDto(candidateRepo.save(c));
    }

    @Transactional(readOnly = true)
    public List<StageHistoryDto> getStageHistory(Long candidateId) {
        if (!candidateRepo.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate not found: " + candidateId);
        }
        return historyRepo.findByCandidateIdOrderByChangedAtDesc(candidateId)
                .stream().map(this::toHistoryDto).toList();
    }

    @Transactional
    public NoteDto addNote(Long candidateId, NoteRequest req) {
        Candidate c = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + candidateId));
        Note note = new Note();
        note.setCandidate(c);
        note.setContent(req.getContent());
        note.setCreatedBy(req.getCreatedBy());
        return toNoteDto(noteRepo.save(note));
    }

    @Transactional(readOnly = true)
    public List<NoteDto> getNotes(Long candidateId) {
        if (!candidateRepo.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate not found: " + candidateId);
        }
        return noteRepo.findByCandidateIdOrderByCreatedAtDesc(candidateId)
                .stream().map(this::toNoteDto).toList();
    }

    private void applyRequest(CandidateRequest req, Candidate c) {
        c.setName(req.getName().trim());
        c.setEmail(req.getEmail().trim().toLowerCase());
        c.setPhone(req.getPhone());
        c.setSkills(req.getSkills());
        c.setExperienceYears(req.getExperienceYears());
        c.setSource(req.getSource());
        c.setResumeUrl(req.getResumeUrl());
        if (req.getJobId() != null) {
            Job job = jobRepo.findById(req.getJobId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + req.getJobId()));
            c.setJob(job);
        } else {
            c.setJob(null);
        }
    }

    private StageHistory buildHistoryEntry(HiringStage from, HiringStage to, String changedBy, LocalDateTime at) {
        StageHistory h = new StageHistory();
        h.setFromStage(from);
        h.setToStage(to);
        h.setChangedAt(at != null ? at : LocalDateTime.now());
        h.setChangedBy(changedBy != null ? changedBy : "recruiter");
        return h;
    }

    private CandidateDto toDto(Candidate c) {
        CandidateDto dto = new CandidateDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setEmail(c.getEmail());
        dto.setPhone(c.getPhone());
        dto.setSkills(c.getSkills());
        dto.setExperienceYears(c.getExperienceYears());
        dto.setSource(c.getSource());
        dto.setResumeUrl(c.getResumeUrl());
        dto.setCurrentStage(c.getCurrentStage());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        if (c.getJob() != null) {
            dto.setJobId(c.getJob().getId());
            dto.setJobTitle(c.getJob().getTitle());
        }
        return dto;
    }

    private StageHistoryDto toHistoryDto(StageHistory h) {
        StageHistoryDto dto = new StageHistoryDto();
        dto.setId(h.getId());
        dto.setFromStage(h.getFromStage());
        dto.setToStage(h.getToStage());
        dto.setChangedAt(h.getChangedAt());
        dto.setChangedBy(h.getChangedBy());
        return dto;
    }

    private NoteDto toNoteDto(Note n) {
        NoteDto dto = new NoteDto();
        dto.setId(n.getId());
        dto.setContent(n.getContent());
        dto.setCreatedAt(n.getCreatedAt());
        dto.setCreatedBy(n.getCreatedBy());
        return dto;
    }
}
