package com.example.auth.dto;

import java.time.LocalDateTime;

/** Ячейка матрицы аналитики: результат студента по конкретному заданию. */
public record TestAnalyticsStudentCellDto(
        long testQuestionId,
        boolean passed,
        boolean onTime,
        boolean attemptsOk,
        int attemptsUsed,
        int maxAttempts,
        Integer timeSpentSeconds,
        String solutionStatus,
        String statusLabel,
        LocalDateTime updatedAt,
        String taskContent,
        String content) {}
