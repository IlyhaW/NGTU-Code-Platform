package com.example.auth.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO представления тест-кейсов для варианта задачи.
 */
public class TaskTestCasesViewDto {
    private Long assignmentId;
    private Long taskId;
    private Long variantId;
    private String taskTitle;
    private String variantName;
    private String variantContent;
    private List<TaskTestCaseDto> openCases = new ArrayList<>();
    private List<TaskTestCaseDto> hiddenCases = new ArrayList<>();

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public String getVariantName() {
        return variantName;
    }

    public void setVariantName(String variantName) {
        this.variantName = variantName;
    }

    public String getVariantContent() {
        return variantContent;
    }

    public void setVariantContent(String variantContent) {
        this.variantContent = variantContent;
    }

    public List<TaskTestCaseDto> getOpenCases() {
        return openCases;
    }

    public void setOpenCases(List<TaskTestCaseDto> openCases) {
        this.openCases = openCases;
    }

    public List<TaskTestCaseDto> getHiddenCases() {
        return hiddenCases;
    }

    public void setHiddenCases(List<TaskTestCaseDto> hiddenCases) {
        this.hiddenCases = hiddenCases;
    }
}
