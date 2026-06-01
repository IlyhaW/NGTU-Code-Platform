package com.example.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Сущность задачи внутри учебной темы.
 */
@Entity
@Table(schema = "edu", name = "assignment_tasks")
public class AssignmentTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assignment_id", nullable = false)
    private Long assignmentId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "input_format", columnDefinition = "TEXT")
    private String inputFormat;

    @Column(name = "output_format", columnDefinition = "TEXT")
    private String outputFormat;

    @Column(name = "judge_time_limit_ms")
    private Integer judgeTimeLimitMs;

    @Column(name = "judge_memory_limit_kb")
    private Integer judgeMemoryLimitKb;

    @Column(name = "solution_algorithm", columnDefinition = "TEXT")
    private String solutionAlgorithm;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getInputFormat() {
        return inputFormat;
    }

    public void setInputFormat(String inputFormat) {
        this.inputFormat = inputFormat;
    }

    public String getOutputFormat() {
        return outputFormat;
    }

    public void setOutputFormat(String outputFormat) {
        this.outputFormat = outputFormat;
    }

    public Integer getJudgeTimeLimitMs() {
        return judgeTimeLimitMs;
    }

    public void setJudgeTimeLimitMs(Integer judgeTimeLimitMs) {
        this.judgeTimeLimitMs = judgeTimeLimitMs;
    }

    public Integer getJudgeMemoryLimitKb() {
        return judgeMemoryLimitKb;
    }

    public void setJudgeMemoryLimitKb(Integer judgeMemoryLimitKb) {
        this.judgeMemoryLimitKb = judgeMemoryLimitKb;
    }

    public String getSolutionAlgorithm() {
        return solutionAlgorithm;
    }

    public void setSolutionAlgorithm(String solutionAlgorithm) {
        this.solutionAlgorithm = solutionAlgorithm;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
