package com.example.auth.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CreateTestRequest {
    private String name;
    private List<Long> groupIds;
    /** Вопросы теста: задачи из тем с параметрами */
    private List<CreateTestQuestionItem> questions;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer totalTimeMinutes;
    private boolean allowLateSubmission;
    /** draft | active | archived */
    private String status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Long> getGroupIds() {
        return groupIds;
    }

    public void setGroupIds(List<Long> groupIds) {
        this.groupIds = groupIds;
    }

    public List<CreateTestQuestionItem> getQuestions() {
        return questions;
    }

    public void setQuestions(List<CreateTestQuestionItem> questions) {
        this.questions = questions;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Integer getTotalTimeMinutes() {
        return totalTimeMinutes;
    }

    public void setTotalTimeMinutes(Integer totalTimeMinutes) {
        this.totalTimeMinutes = totalTimeMinutes;
    }

    public boolean isAllowLateSubmission() {
        return allowLateSubmission;
    }

    public void setAllowLateSubmission(boolean allowLateSubmission) {
        this.allowLateSubmission = allowLateSubmission;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
