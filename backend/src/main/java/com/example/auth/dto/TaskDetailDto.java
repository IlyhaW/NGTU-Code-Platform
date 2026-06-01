package com.example.auth.dto;

import java.util.List;

/** Задача темы со списком вариантов формулировок. */
public class TaskDetailDto {
    private Long id;
    private Long assignmentId;
    private String title;
    private List<String> tags;
    private String inputFormat;
    private String outputFormat;
    private Integer judgeTimeLimitMs;
    private Integer judgeMemoryLimitKb;
    private String solutionAlgorithm;
    private List<VariantSummaryDto> variants;

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

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
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

    public List<VariantSummaryDto> getVariants() {
        return variants;
    }

    public void setVariants(List<VariantSummaryDto> variants) {
        this.variants = variants;
    }
}
