package com.example.auth.dto;

/** Краткая информация о варианте в списке у задачи. */
public class VariantSummaryDto {
    private Long id;
    private String name;

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
}
