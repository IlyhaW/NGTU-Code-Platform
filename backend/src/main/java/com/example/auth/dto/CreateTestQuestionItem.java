package com.example.auth.dto;

public class CreateTestQuestionItem {
    private Long assignmentId;
    private Long assignmentTaskId;
    /** Если в JSON нет поля — null, проверяется в сервисе */
    private Integer maxAttempts;
    private Integer solveTimeMinutes;
    private boolean individualVariants;

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Long getAssignmentTaskId() {
        return assignmentTaskId;
    }

    public void setAssignmentTaskId(Long assignmentTaskId) {
        this.assignmentTaskId = assignmentTaskId;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Integer getSolveTimeMinutes() {
        return solveTimeMinutes;
    }

    public void setSolveTimeMinutes(Integer solveTimeMinutes) {
        this.solveTimeMinutes = solveTimeMinutes;
    }

    public boolean isIndividualVariants() {
        return individualVariants;
    }

    public void setIndividualVariants(boolean individualVariants) {
        this.individualVariants = individualVariants;
    }
}
