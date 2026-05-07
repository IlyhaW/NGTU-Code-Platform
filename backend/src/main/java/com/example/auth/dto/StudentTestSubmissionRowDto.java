package com.example.auth.dto;

import java.util.ArrayList;
import java.util.List;

/** Студент и его ответы по всем заданиям теста. */
public class StudentTestSubmissionRowDto {

    private Long studentId;
    private String fullName;
    private List<StudentTestAnswerItemDto> answers = new ArrayList<>();

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<StudentTestAnswerItemDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<StudentTestAnswerItemDto> answers) {
        this.answers = answers;
    }
}
