package com.example.auth.dto;

/**
 * Пакетное создание черновиков вариантов на основе исходной формулировки.
 */
public class GenerateVariantsRequest {
    /** Число новых вариантов (1–300). */
    private Integer count;
    /** Сложность по шкале 1–5. */
    private Integer difficulty;
    /** Стиль / описание (произвольная строка). */
    private String style;
    /**
     * Если true — все варианты кроме исходного удаляются, затем создаются новые
     * (режим «сгенерировать заново»).
     */
    private Boolean replaceExisting;

    public Integer getCount() {
        return count;
    }

    public void setCount(Integer count) {
        this.count = count;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }

    public String getStyle() {
        return style;
    }

    public void setStyle(String style) {
        this.style = style;
    }

    public Boolean getReplaceExisting() {
        return replaceExisting;
    }

    public void setReplaceExisting(Boolean replaceExisting) {
        this.replaceExisting = replaceExisting;
    }
}
