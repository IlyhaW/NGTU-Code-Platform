package com.example.auth.dto;

/** Распределение числа использованных попыток по всем ответам (ячейка задание×студент). */
public record TestAnalyticsAttemptBinDto(String label, long count) {}
