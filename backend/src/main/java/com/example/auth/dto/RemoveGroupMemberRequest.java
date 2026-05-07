package com.example.auth.dto;

/** Убрать пользователя из группы (тело POST вместо пути …/members/{id}/remove). */
public class RemoveGroupMemberRequest {
    private Long groupId;
    private Long userId;

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
