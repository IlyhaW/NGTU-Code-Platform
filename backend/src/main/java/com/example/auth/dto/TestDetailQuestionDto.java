package com.example.auth.dto;

/**
 * DTO вопроса в детальной карточке теста преподавателя.
 */
public class TestDetailQuestionDto {

    private Long assignmentId;
    private Long assignmentTaskId;
    private String assignmentName;
    private String taskName;
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
