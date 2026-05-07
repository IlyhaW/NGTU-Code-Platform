package com.example.auth.repository;

import com.example.auth.entity.StudentTestCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для отметок о завершении тестов студентами.
 */
public interface StudentTestCompletionRepository extends JpaRepository<StudentTestCompletion, Long> {

    /**
     * Возвращает все отметки завершения по тесту.
     */
    List<StudentTestCompletion> findByTest_Id(Long testId);

    /**
     * Проверяет факт завершения теста конкретным студентом.
     */
    boolean existsByUserIdAndTestId(Long userId, Long testId);

    /**
     * Находит отметку завершения теста студентом.
     */
    Optional<StudentTestCompletion> findByUserIdAndTestId(Long userId, Long testId);

    /**
     * Возвращает завершенные тесты студента вместе с сущностью теста.
     */
    @Query(
            "SELECT c FROM StudentTestCompletion c JOIN FETCH c.test WHERE c.userId = :userId "
                    + "ORDER BY c.completedAt DESC")
    List<StudentTestCompletion> findByUserIdWithTestOrderByCompletedAtDesc(@Param("userId") Long userId);
}
