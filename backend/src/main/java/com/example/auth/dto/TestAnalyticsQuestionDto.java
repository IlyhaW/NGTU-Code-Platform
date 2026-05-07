package com.example.auth.dto;

/** Одна строка сводки по заданию теста (для графиков и таблицы). */
public record TestAnalyticsQuestionDto(
        long testQuestionId,
        int sortOrder,
        String assignmentName,
        String taskName,
        /** Сдано (solution_status = graded_pass). */
        int passedCount,
        /** Не сдано (есть запись, но статус не graded_pass). */
        int failedCount,
        /** Пропуск (нет записи ответа по заданию). */
        int skippedCount,
        /** Студентов с записью ответа (включая пустой текст). */
        int studentsWithRecord,
        /** Непустой сохранённый ответ. */
        int nonEmptyAnswers,
        double avgAttempts,
        /** Среднее время на задание, сек.; null если нет данных. */
        Double avgTimeSpentSeconds) {}
