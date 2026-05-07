package com.example.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(schema = "edu", name = "test_questions")
/**
 * Сущность вопроса внутри теста.
 */
public class TestQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "test_id")
    private EduTest test;

    @Column(name = "assignment_id", nullable = false)
    private Long assignmentId;

    /**
     * Идентификатор задачи темы, используемой в вопросе.
     */
    @Column(name = "assignment_task_id")
    private Long assignmentTaskId;

    @Column(name = "individual_variants", nullable = false)
    private boolean individualVariants;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 1;

    @Column(name = "solve_time_minutes")
    private Integer solveTimeMinutes;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EduTest getTest() {
        return test;
    }

    public void setTest(EduTest test) {
        this.test = test;
    }

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Long getAssignmentTaskId() {
        return assignmentTaskId;
    }

    public void setAssignmentTaskId(Long assignmentTaskId) {
        this.assignmentTaskId = assignmentTaskId;
    }

    public boolean isIndividualVariants() {
        return individualVariants;
    }

    public void setIndividualVariants(boolean individualVariants) {
        this.individualVariants = individualVariants;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Integer getSolveTimeMinutes() {
        return solveTimeMinutes;
    }

    public void setSolveTimeMinutes(Integer solveTimeMinutes) {
        this.solveTimeMinutes = solveTimeMinutes;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
