package com.example.auth.dto;

/** Тело POST /student/tests/{testId}/complete — опционально общее время прохождения. */
public class CompleteStudentTestRequest {

    /** Секунды, накопленные на клиенте с открытия теста до «Завершить». */
    private Integer totalTimeSeconds;

    public Integer getTotalTimeSeconds() {
        return totalTimeSeconds;
    }

    public void setTotalTimeSeconds(Integer totalTimeSeconds) {
        this.totalTimeSeconds = totalTimeSeconds;
    }
}
