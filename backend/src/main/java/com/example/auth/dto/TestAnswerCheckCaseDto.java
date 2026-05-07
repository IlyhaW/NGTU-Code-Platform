package com.example.auth.dto;

/**
 * DTO результата проверки одного тест-кейса.
 */
public record TestAnswerCheckCaseDto(
        long testCaseId,
        boolean passed,
        String verdict,
        long timeMs,
        long memoryKb,
        String message) {}
