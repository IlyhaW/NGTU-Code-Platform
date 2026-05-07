package com.example.auth.repository;

import com.example.auth.entity.TestQuestionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Репозиторий ответов студентов на вопросы теста.
 */
public interface TestQuestionAnswerRepository extends JpaRepository<TestQuestionAnswer, Long> {

    /**
     * Находит ответ студента на конкретный вопрос теста.
     */
    Optional<TestQuestionAnswer> findByTestQuestion_IdAndStudentUserId(Long testQuestionId, Long studentUserId);

    /**
     * Возвращает ответы студента по набору вопросов.
     */
    List<TestQuestionAnswer> findByTestQuestion_IdInAndStudentUserId(
            Collection<Long> testQuestionIds, Long studentUserId);

    /**
     * Возвращает все ответы студентов по тесту.
     */
    List<TestQuestionAnswer> findByTestQuestion_Test_Id(Long testId);

    /**
     * Возвращает ответы конкретного студента по тесту.
     */
    List<TestQuestionAnswer> findByStudentUserIdAndTestQuestion_Test_Id(Long studentUserId, Long testId);
}
