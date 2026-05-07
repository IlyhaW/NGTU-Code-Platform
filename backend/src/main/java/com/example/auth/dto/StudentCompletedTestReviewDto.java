package com.example.auth.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Просмотр завершённого теста: задачи, ответы, метрики. */
public class StudentCompletedTestReviewDto {

    private Long testId;
    private String testName;
    private LocalDateTime completedAt;
    private Integer totalTimeSeconds;
    private List<StudentCompletedQuestionReviewDto> questions = new ArrayList<>();

    public Long getTestId() {
        return testId;
    }

    public void setTestId(Long testId) {
        this.testId = testId;
    }

    public String getTestName() {
        return testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Integer getTotalTimeSeconds() {
        return totalTimeSeconds;
    }

    public void setTotalTimeSeconds(Integer totalTimeSeconds) {
        this.totalTimeSeconds = totalTimeSeconds;
    }

    public List<StudentCompletedQuestionReviewDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<StudentCompletedQuestionReviewDto> questions) {
        this.questions = questions;
    }
}
