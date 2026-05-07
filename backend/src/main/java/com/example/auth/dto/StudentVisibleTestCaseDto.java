package com.example.auth.dto;

/**
 * DTO публичного тест-кейса, показываемого студенту.
 */
public class StudentVisibleTestCaseDto {
    private String inputData;
    private String expectedOutput;

    public String getInputData() {
        return inputData;
    }

    public void setInputData(String inputData) {
        this.inputData = inputData;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }

    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = expectedOutput;
    }
}
