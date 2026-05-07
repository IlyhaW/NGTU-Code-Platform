package com.example.auth.dto;

import java.util.List;

/**
 * DTO запроса на обновление темы.
 */
public class UpdateAssignmentRequest {
    private String name;
    private List<String> tags;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
