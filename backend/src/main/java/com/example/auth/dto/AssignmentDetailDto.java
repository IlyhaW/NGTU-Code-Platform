package com.example.auth.dto;

import java.util.List;

/** Одна тема с тегами и списком задач (вариантов). */
public class AssignmentDetailDto {
    private Long id;
    private String name;
    private Long teacherId;
    private Integer variantsCount;
    private List<String> tags;
    private List<AssignmentTaskDto> tasks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
    public Integer getVariantsCount() { return variantsCount; }
    public void setVariantsCount(Integer variantsCount) { this.variantsCount = variantsCount; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public List<AssignmentTaskDto> getTasks() { return tasks; }
    public void setTasks(List<AssignmentTaskDto> tasks) { this.tasks = tasks; }
}
