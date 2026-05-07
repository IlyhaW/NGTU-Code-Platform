package com.example.auth.dto;

import java.util.List;

/** Результат проверки решения студента по тестам задачи. */
public record TestAnswerCheckDto(
        long testId,
        long testQuestionId,
        String language,
        String verdict,
        int passedCount,
        int totalCount,
        long maxTimeMs,
        long maxMemoryKb,
        String message,
        List<TestAnswerCheckCaseDto> cases) {}
