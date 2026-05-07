package com.example.auth.dto;

public record TestAnalyticsGroupDto(
        long groupId,
        String groupName,
        int studentsInGroup,
        int completedInGroup,
        /** Уникальных студентов с хотя бы одним непустым ответом по тесту. */
        int withNonEmptyAnswers) {}
