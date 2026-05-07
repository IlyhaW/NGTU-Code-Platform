package com.example.auth.dto;

import java.util.ArrayList;
import java.util.List;

/** Ответы студентов по тесту (для преподавателя). */
public class TestSubmissionsDto {

    private Long testId;
    private String testName;
    private List<StudentTestSubmissionRowDto> students = new ArrayList<>();

    public Long getTestId() {
        return testId;
    }

    public void setTestId(Long testId) {
        this.testId = testId;
    }

    public String getTestName() {
        return testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public List<StudentTestSubmissionRowDto> getStudents() {
        return students;
    }

    public void setStudents(List<StudentTestSubmissionRowDto> students) {
        this.students = students;
    }
}
