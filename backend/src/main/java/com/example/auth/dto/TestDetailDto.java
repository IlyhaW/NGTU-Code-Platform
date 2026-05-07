package com.example.auth.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TestDetailDto {

    private Long id;
    private String name;
    private List<TestDetailGroupDto> groups = new ArrayList<>();
    private List<TestDetailQuestionDto> questions = new ArrayList<>();
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    /** null если в БД 0 (лимит не задан) */
    private Integer totalTimeMinutes;
    private boolean allowLateSubmission;
    private String status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<TestDetailGroupDto> getGroups() {
        return groups;
    }

    public void setGroups(List<TestDetailGroupDto> groups) {
        this.groups = groups;
    }

    public List<TestDetailQuestionDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<TestDetailQuestionDto> questions) {
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
