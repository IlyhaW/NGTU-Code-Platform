package com.example.auth.dto;

/**
 * Ответ GET /api/auth/me — id, ФИО и роль текущего пользователя по JWT.
 */
public class CurrentUserDto {
    private Long id;
    private String fullName;
    private String role;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
