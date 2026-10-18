package com.ats.service;

import com.ats.dto.JobDto;
import com.ats.dto.JobRequest;
import com.ats.entity.Job;
import com.ats.exception.ConflictException;
import com.ats.exception.ResourceNotFoundException;
import com.ats.repository.CandidateRepository;
import com.ats.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepo;
    private final CandidateRepository candidateRepo;

    @Transactional(readOnly = true)
    public List<JobDto> getAll() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : jobRepo.countCandidatesPerJob()) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return jobRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(job -> toDto(job, counts.getOrDefault(job.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public JobDto getById(Long id) {
        Job job = find(id);
        return toDto(job, candidateRepo.countByJobId(id));
    }

    @Transactional
    public JobDto create(JobRequest req) {
        Job job = new Job();
        applyRequest(req, job);
        return toDto(jobRepo.save(job), 0);
    }

    @Transactional
    public JobDto update(Long id, JobRequest req) {
        Job job = find(id);
        applyRequest(req, job);
        return toDto(jobRepo.save(job), candidateRepo.countByJobId(id));
    }

    @Transactional
    public void delete(Long id) {
        Job job = find(id);
        if (candidateRepo.countByJobId(id) > 0) {
            throw new ConflictException("This job has candidates attached. Close it instead of deleting it.");
        }
        jobRepo.delete(job);
    }

    private Job find(Long id) {
        return jobRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + id));
    }

    private void applyRequest(JobRequest req, Job job) {
        job.setTitle(req.getTitle().trim());
        job.setDepartment(req.getDepartment().trim());
        job.setLocation(req.getLocation().trim());
        job.setStatus(req.getStatus());
    }

    private JobDto toDto(Job job, long candidateCount) {
        JobDto dto = new JobDto();
        dto.setId(job.getId());
        dto.setTitle(job.getTitle());
        dto.setDepartment(job.getDepartment());
        dto.setLocation(job.getLocation());
        dto.setStatus(job.getStatus());
        dto.setCreatedAt(job.getCreatedAt());
        dto.setUpdatedAt(job.getUpdatedAt());
        dto.setCandidateCount(candidateCount);
        return dto;
    }
}
