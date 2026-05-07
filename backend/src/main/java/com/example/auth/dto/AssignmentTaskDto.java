package com.example.auth.dto;

import java.util.List;

/** Элемент списка задач темы. */
public class AssignmentTaskDto {
    private Long id;
    private String name;
    private List<String> tags;
    /** Число вариантов формулировок у этой задачи. */
    private Integer variantsCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public Integer getVariantsCount() { return variantsCount; }
    public void setVariantsCount(Integer variantsCount) { this.variantsCount = variantsCount; }
}
