package com.example.auth.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO краткой информации о теме.
 */
public class AssignmentDto {
    private Long id;
    private String name;
    private Long teacherId;
    private LocalDateTime createdAt;
    private Integer variantsCount;
    private List<String> tags;

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

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getVariantsCount() {
        return variantsCount;
    }

    public void setVariantsCount(Integer variantsCount) {
        this.variantsCount = variantsCount;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }
}
