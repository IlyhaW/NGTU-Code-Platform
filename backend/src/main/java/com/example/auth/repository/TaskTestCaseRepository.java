package com.example.auth.repository;

import com.example.auth.entity.TaskTestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Репозиторий для тест-кейсов задач.
 */
public interface TaskTestCaseRepository extends JpaRepository<TaskTestCase, Long> {
    /**
     * Возвращает активные тест-кейсы задачи.
     */
    List<TaskTestCase> findByTaskIdAndActiveTrueOrderByIdAsc(Long taskId);

    /**
     * Возвращает активные тест-кейсы конкретного варианта задачи.
     */
    List<TaskTestCase> findByTaskIdAndVariantIdAndActiveTrueOrderByIdAsc(Long taskId, Long variantId);

    /**
     * Возвращает публичные активные тест-кейсы варианта задачи.
     */
    List<TaskTestCase> findByTaskIdAndVariantIdAndIsPublicTrueAndActiveTrueOrderByIdAsc(Long taskId, Long variantId);

    /**
     * Возвращает активные базовые тест-кейсы задачи без привязки к варианту.
     */
    List<TaskTestCase> findByTaskIdAndVariantIdIsNullAndActiveTrueOrderByIdAsc(Long taskId);

    /**
     * Возвращает публичные активные базовые тест-кейсы задачи.
     */
    List<TaskTestCase> findByTaskIdAndVariantIdIsNullAndIsPublicTrueAndActiveTrueOrderByIdAsc(Long taskId);

    /**
     * Деактивирует все активные тест-кейсы задачи.
     */
    @Modifying
    @Query("UPDATE TaskTestCase tc SET tc.active = false WHERE tc.taskId = :taskId AND tc.active = true")
    int deactivateActiveByTaskId(@Param("taskId") Long taskId);
}
