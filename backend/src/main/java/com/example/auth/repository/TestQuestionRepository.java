package com.example.auth.repository;

import com.example.auth.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Репозиторий вопросов теста.
 */
public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

    /**
     * Находит вопрос по идентификатору в рамках указанного теста.
     */
    Optional<TestQuestion> findByIdAndTest_Id(Long testQuestionId, Long testId);
}
