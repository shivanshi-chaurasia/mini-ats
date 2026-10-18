package com.ats.repository;

import com.ats.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByCandidateIdOrderByCreatedAtDesc(Long candidateId);
}
