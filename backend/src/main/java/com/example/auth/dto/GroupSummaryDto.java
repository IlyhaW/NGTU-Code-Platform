package com.example.auth.dto;

/**
 * DTO краткой информации об учебной группе.
 */
public class GroupSummaryDto {

    private Long id;
    private String name;
    private long memberCount;

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

    public long getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(long memberCount) {
        this.memberCount = memberCount;
    }
}
