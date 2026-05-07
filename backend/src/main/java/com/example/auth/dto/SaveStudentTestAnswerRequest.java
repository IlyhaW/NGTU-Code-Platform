package com.example.auth.dto;

/** Тело PUT /student/tests/{id}/answers */
public class SaveStudentTestAnswerRequest {

    private Long testQuestionId;
    private String content;
    /** Накопленное время на этой задаче (сек), с клиента. */
    private Integer timeSpentSeconds;

    public Long getTestQuestionId() {
        return testQuestionId;
    }

    public void setTestQuestionId(Long testQuestionId) {
        this.testQuestionId = testQuestionId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getTimeSpentSeconds() {
        return timeSpentSeconds;
    }

    public void setTimeSpentSeconds(Integer timeSpentSeconds) {
        this.timeSpentSeconds = timeSpentSeconds;
    }
}
