package com.example.auth.dto;

/** Колонка матрицы аналитики: одно задание теста. */
public record TestAnalyticsQuestionColumnDto(
        long testQuestionId,
        int sortOrder,
        String assignmentName,
        String taskName,
        int maxAttempts,
        Integer solveTimeMinutes) {}
