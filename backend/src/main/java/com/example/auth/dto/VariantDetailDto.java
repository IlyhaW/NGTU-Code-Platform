package com.example.auth.dto;

/** Одна задача (вариант) с контентом для страницы задачи. */
public class VariantDetailDto {
    private Long id;
    private Long assignmentId;
    private Long taskId;
    private String variantName;
    private String content;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
