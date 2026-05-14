package com.example.auth.dto;

/** Одна задача в просмотре завершённого теста. */
public class StudentCompletedQuestionReviewDto {

    private Long testQuestionId;
    private int sortOrder;
    private String assignmentName;
    private String taskName;
    private String taskContent;
    private int maxAttempts;
    private int attemptsUsed;
    private Integer timeSpentSeconds;
    /** Код решения; пусто если не сохраняли. */
    private String solutionContent;
    /** Технический статус: saved | graded_pass | graded_fail | none. */
    private String solutionStatus;
    /** Подпись для интерфейса. */
    private String statusLabel;

    public Long getTestQuestionId() {
        return testQuestionId;
    }

    public void setTestQuestionId(Long testQuestionId) {
        this.testQuestionId = testQuestionId;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getAssignmentName() {
        return assignmentName;
    }

    public void setAssignmentName(String assignmentName) {
        this.assignmentName = assignmentName;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getTaskContent() {
        return taskContent;
    }

    public void setTaskContent(String taskContent) {
        this.taskContent = taskContent;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getAttemptsUsed() {
        return attemptsUsed;
    }

    public void setAttemptsUsed(int attemptsUsed) {
        this.attemptsUsed = attemptsUsed;
    }

    public Integer getTimeSpentSeconds() {
        return timeSpentSeconds;
    }

    public void setTimeSpentSeconds(Integer timeSpentSeconds) {
        this.timeSpentSeconds = timeSpentSeconds;
    }

    public String getSolutionContent() {
        return solutionContent;
    }

    public void setSolutionContent(String solutionContent) {
        this.solutionContent = solutionContent;
    }

    public String getSolutionStatus() {
        return solutionStatus;
    }

    public void setSolutionStatus(String solutionStatus) {
        this.solutionStatus = solutionStatus;
    }

    public String getStatusLabel() {
        return statusLabel;
    }

    public void setStatusLabel(String statusLabel) {
        this.statusLabel = statusLabel;
    }
}
