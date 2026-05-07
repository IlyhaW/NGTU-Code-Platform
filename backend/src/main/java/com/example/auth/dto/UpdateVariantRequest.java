package com.example.auth.dto;

/**
 * DTO запроса на обновление варианта задачи.
 */
public class UpdateVariantRequest {
    private String variantName;
    private String content;

    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
