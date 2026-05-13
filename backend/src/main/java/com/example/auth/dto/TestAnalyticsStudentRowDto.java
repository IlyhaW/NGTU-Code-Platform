package com.example.auth.dto;

import java.util.List;

/** Строка матрицы аналитики: студент и его результаты по заданиям теста. */
public record TestAnalyticsStudentRowDto(
        long studentId,
        String fullName,
        String groupName,
        int passedCount,
        int totalCount,
        String score,
        List<TestAnalyticsStudentCellDto> cells) {}
