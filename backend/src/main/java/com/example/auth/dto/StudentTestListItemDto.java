package com.example.auth.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Элемент списка тестов для студента (назначение через группу). */
public class StudentTestListItemDto {

    private Long id;
    private String name;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    /** Названия тем (assignments), из которых собран тест, через запятую. */
    private String topicsSummary;
    private List<String> tags = new ArrayList<>();

    /** Только для GET /student/tests/completed — когда студент завершил тест. */
    private LocalDateTime completedAt;

    /** Секунды, переданные при «Завершить тест»; только для завершённых. */
    private Integer totalTimeSeconds;

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

    public String getTopicsSummary() {
        return topicsSummary;
    }

    public void setTopicsSummary(String topicsSummary) {
        this.topicsSummary = topicsSummary;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
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
}
