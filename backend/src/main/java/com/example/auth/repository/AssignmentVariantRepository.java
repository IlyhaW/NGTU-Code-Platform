package com.example.auth.repository;

import com.example.auth.entity.AssignmentVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Репозиторий для работы с вариантами формулировок задач.
 */
public interface AssignmentVariantRepository extends JpaRepository<AssignmentVariant, Long> {

    /**
     * Возвращает варианты задачи в стабильном порядке по идентификатору.
     */
    List<AssignmentVariant> findByTaskIdOrderByIdAsc(Long taskId);

    /**
     * Считает количество вариантов у задачи.
     */
    long countByTaskId(Long taskId);

    /**
     * Считает общее число вариантов по всем задачам темы.
     */
    @Query("SELECT COUNT(v) FROM AssignmentVariant v WHERE v.taskId IN (SELECT t.id FROM AssignmentTask t WHERE t.assignmentId = :aid)")
    long countVariantsForAssignment(@Param("aid") Long assignmentId);
}
