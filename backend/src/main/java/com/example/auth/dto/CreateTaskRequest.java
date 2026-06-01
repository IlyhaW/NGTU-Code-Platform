package com.example.auth.dto;

import java.util.List;

/** Создание новой задачи в теме (появится первый вариант «Вариант 1»). */
public class CreateTaskRequest {
    private String title;
    private List<String> tags;
    private String inputFormat;
    private String outputFormat;
    /** Ограничение времени выполнения решения в миллисекундах. */
    private Integer judgeTimeLimitMs;
    /** Ограничение памяти выполнения решения в килобайтах. */
    private Integer judgeMemoryLimitKb;
    /** Единый алгоритм решения для всех вариантов задачи (описание, формула, псевдокод). */
    private String solutionAlgorithm;

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
}
