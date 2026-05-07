package com.example.auth.dto;

public record TestAnalyticsDayDto(
        String date,
        long answerEvents,
        /** Уникальных студентов, у которых в этот день обновлялся хотя бы один ответ. */
        long activeStudents) {}
