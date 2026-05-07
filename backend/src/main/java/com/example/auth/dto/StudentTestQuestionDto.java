package com.example.auth.dto;

import java.util.ArrayList;
import java.util.List;

/** Одна задача внутри теста для студента (с текстом первого варианта). */
public class StudentTestQuestionDto {

    /** id строки edu.test_questions — для сохранения ответа. */
    private Long testQuestionId;

    /** Порядок в тесте, с 0. */
    private int sortOrder;
    private String assignmentName;
    private String taskName;
    /** Текст формулировки (первый вариант задачи). */
    private String taskContent;

    /** Сохранённый в БД ответ (код), может быть пустым. */
    private String savedAnswer;
    /** Сколько попыток уже использовано (по сохранениям/проверкам). */
    private Integer attemptsUsed;
    private Integer maxAttempts;
    private Integer solveTimeMinutes;
    private boolean individualVariants;
    private String inputFormat;
    private String outputFormat;
    private Integer judgeTimeLimitMs;
    private Integer judgeMemoryLimitKb;
    private List<StudentVisibleTestCaseDto> openTestCases = new ArrayList<>();
    private String solutionStatus;
    private String statusLabel;

    public Long getTestQuestionId() {
        return testQuestionId;
    }

    public void setTestQuestionId(Long testQuestionId) {
        this.testQuestionId = testQuestionId;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
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

    public String getTaskContent() {
        return taskContent;
    }

    public void setTaskContent(String taskContent) {
        this.taskContent = taskContent;
    }

    public String getSavedAnswer() {
        return savedAnswer;
    }

    public void setSavedAnswer(String savedAnswer) {
        this.savedAnswer = savedAnswer;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public Integer getAttemptsUsed() {
        return attemptsUsed;
    }

    public void setAttemptsUsed(Integer attemptsUsed) {
        this.attemptsUsed = attemptsUsed;
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

    public List<StudentVisibleTestCaseDto> getOpenTestCases() {
        return openTestCases;
    }

    public void setOpenTestCases(List<StudentVisibleTestCaseDto> openTestCases) {
        this.openTestCases = openTestCases;
    }

    public String getSolutionStatus() {
        return solutionStatus;
    }

    public void setSolutionStatus(String solutionStatus) {
        this.solutionStatus = solutionStatus;
    }

    public String getStatusLabel() {
        return statusLabel;
    }

    public void setStatusLabel(String statusLabel) {
        this.statusLabel = statusLabel;
    }
}
