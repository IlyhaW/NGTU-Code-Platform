package com.example.auth.repository;

import com.example.auth.entity.AssignmentTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с задачами внутри тем.
 */
public interface AssignmentTaskRepository extends JpaRepository<AssignmentTask, Long> {

    /**
     * Возвращает задачи темы в порядке сортировки и идентификатора.
     */
    List<AssignmentTask> findByAssignmentIdOrderBySortOrderAscIdAsc(Long assignmentId);

    /**
     * Находит задачу по идентификатору и теме.
     */
    Optional<AssignmentTask> findByIdAndAssignmentId(Long id, Long assignmentId);

    /**
     * Считает количество задач в теме.
     */
    long countByAssignmentId(Long assignmentId);
}
