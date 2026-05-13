package com.example.auth.dto;

import java.util.List;

/** Сводная аналитика по тесту для преподавателя (графики + метрики). */
public record TestAnalyticsDto(
        long testId,
        String testName,
        String status,
        int totalStudentsInGroups,
        int completedStudents,
        int studentsWithAnyAnswerRow,
        int studentsWithNonEmptyAnswer,
        int totalAnswerRows,
        int questionCount,
        List<TestAnalyticsQuestionDto> questions,
        List<TestAnalyticsQuestionColumnDto> questionColumns,
        List<TestAnalyticsStudentRowDto> studentRows,
        List<TestAnalyticsGroupDto> byGroup,
        List<TestAnalyticsStatusSliceDto> statusDistribution,
        List<TestAnalyticsAttemptBinDto> attemptDistribution,
        List<TestAnalyticsDayDto> activityByDay) {}
