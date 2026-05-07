package com.example.auth.dto;

/**
 * DTO запроса на создание тест-кейса для задачи.
 */
public class CreateTaskTestCaseRequest {
    private String inputData;
    private String expectedOutput;
    private Boolean isPublic;

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

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }
}
