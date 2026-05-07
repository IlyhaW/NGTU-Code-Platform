package com.example.auth.dto;

/**
 * DTO запроса на создание учебной группы.
 */
public class CreateGroupRequest {

    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
