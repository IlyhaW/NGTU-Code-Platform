package com.example.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Component
/**
 * Генератор вариантов задач через OpenRouter/Gemini API.
 */
public class GeminiVariantGenerator {
    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules();
    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    /** Сколько открытых и сколько закрытых тест-кейсов нужно на каждый вариант. */
    public static final int EXPECTED_PUBLIC_TESTS = 5;
    public static final int EXPECTED_PRIVATE_TESTS = 5;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final String apiKey;
    private final String configuredModel;
    private final String referer;
    private final String appTitle;

    /**
     * Инициализирует клиент генерации и параметры подключения к OpenRouter.
     */
    public GeminiVariantGenerator(
            @Value("${openrouter.api-key:}") String apiKey,
            @Value("${openrouter.model:google/gemini-2.0-flash-001}") String configuredModel,
            @Value("${openrouter.referer:http://localhost}") String referer,
            @Value("${openrouter.app-title:auth-zero}") String appTitle) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.configuredModel =
                configuredModel != null ? configuredModel.trim() : "google/gemini-2.0-flash-001";
        this.referer = referer != null ? referer.trim() : "http://localhost";
        this.appTitle = appTitle != null ? appTitle.trim() : "auth-zero";
    }

    /**
     * Пара входных и ожидаемых выходных данных.
     */
    public record GeneratedCase(String input, String output) {}

    /**
     * Сгенерированный вариант: только текст условия и тест-кейсы (открытые и закрытые).
     */
    public record GeneratedVariant(
            String content, List<GeneratedCase> publicTests, List<GeneratedCase> privateTests) {}

    /** Возвращает только тексты вариантов без тест-кейсов и примеров. */
    public List<String> generate(
            String assignmentName,
            String taskTitle,
            String sourceText,
            int count,
            int difficulty,
            String style) {
        List<GeneratedVariant> detailed = generateDetailed(assignmentName, taskTitle, sourceText, count, difficulty, style);
        List<String> out = new ArrayList<>();
        for (GeneratedVariant v : detailed) {
            out.add(v.content());
        }
        return out;
    }

    /** Генерирует подробные варианты с открытыми и закрытыми тест-кейсами. */
    public List<GeneratedVariant> generateDetailed(
            String assignmentName,
            String taskTitle,
            String sourceText,
            int count,
            int difficulty,
            String style) {
        if (apiKey.isBlank()) {
            throw new IllegalArgumentException(
                    "Не задан OpenRouter API key. Укажите openrouter.api-key в application.properties или переменной окружения.");
        }
        String prompt = buildDetailedPrompt(assignmentName, taskTitle, sourceText, count, difficulty, style);
        String body = requestBody(prompt, configuredModel);
        HttpRequest req =
                HttpRequest.newBuilder()
                        .uri(URI.create(OPENROUTER_URL))
                        .timeout(Duration.ofSeconds(60))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .header("HTTP-Referer", referer)
                        .header("X-Title", appTitle)
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();
        try {
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                throw new IllegalArgumentException(
                        "OpenRouter API error: HTTP " + resp.statusCode() + ". " + resp.body());
            }
            return parseDetailedVariants(resp.body(), count);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Ошибка вызова OpenRouter API: " + e.getMessage());
        } catch (IOException e) {
            throw new IllegalArgumentException("Ошибка вызова OpenRouter API: " + e.getMessage());
        }
    }

    /** Собирает prompt для генерации структурированного JSON-ответа. */
    private static String buildDetailedPrompt(
            String assignmentName, String taskTitle, String sourceText, int count, int difficulty, String style) {
        String normalizedStyle = style == null || style.isBlank() ? "нейтральный" : style.trim();
        return """
                Ты помогаешь преподавателю составлять варианты задач по программированию.
                Верни результат строго в JSON без markdown и пояснений:
                {"variants":[{"name":"Вариант 1","content":"...","public_tests":[{"input":"...","output":"..."}],"private_tests":[{"input":"...","output":"..."}]}]}

                Требования:
                - Язык: весь ответ только на русском. Поля name, content, а также все input и output в public_tests и private_tests — на русском (кроме имён переменных/функций в коде, если он есть внутри теста; пояснения к заданию — на русском).
                - Количество вариантов: %d
                - Сложность: %d из 5
                - Стиль формулировки: %s
                - Тематика: %s
                - Базовая задача: %s
                - Основной текст исходного варианта:
                ---
                %s
                ---

                Каждый вариант должен быть самодостаточным текстом условия (что дано, что требуется, формат входа/выхода при необходимости).
                Варианты должны отличаться друг от друга данными/нюансами, но оставаться в той же теме и примерно той же длины.
                Для каждого варианта:
                - поле content: только полный текст условия (без markdown). Не включай в content примеры ввода-вывода, числовые демонстрации, секции «Пример», «Вход», «Выход» — любые демонстрационные пары вход/выход только в public_tests и private_tests.
                - поле public_tests: ровно %d объектов — открытые тест-кейсы (их может видеть студент при проверке).
                - поле private_tests: ровно %d объектов — закрытые тест-кейсы (скрыты от студента).
                public_tests и private_tests: пары input/output в plain text, без markdown.
                """.formatted(
                count,
                difficulty,
                normalizedStyle,
                safe(assignmentName),
                safe(taskTitle),
                safe(sourceText),
                EXPECTED_PUBLIC_TESTS,
                EXPECTED_PRIVATE_TESTS);
    }

    /** Возвращает безопасную строку вместо null. */
    private static String safe(String v) {
        return v == null ? "" : v;
    }

    /** Формирует JSON-тело запроса к OpenRouter API. */
    private static String requestBody(String prompt, String model) {
        try {
            com.fasterxml.jackson.databind.node.ObjectNode root = JSON.createObjectNode();
            root.put("model", model);
            root.put("temperature", 0.8);

            com.fasterxml.jackson.databind.node.ArrayNode messages = JSON.createArrayNode();
            com.fasterxml.jackson.databind.node.ObjectNode system = JSON.createObjectNode();
            system.put("role", "system");
            system.put(
                    "content",
                    "Отвечай строго JSON-объектом формата {\"variants\":[{\"name\":\"...\",\"content\":\"...\",\"public_tests\":[{\"input\":\"...\",\"output\":\"...\"}],\"private_tests\":[{\"input\":\"...\",\"output\":\"...\"}]}]} — только русский язык во всех текстовых полях (условие и тесты), без примеров внутри content.");
            messages.add(system);
            com.fasterxml.jackson.databind.node.ObjectNode user = JSON.createObjectNode();
            user.put("role", "user");
            user.put("content", prompt);
            messages.add(user);
            root.set("messages", messages);

            com.fasterxml.jackson.databind.node.ObjectNode responseFormat = JSON.createObjectNode();
            responseFormat.put("type", "json_object");
            root.set("response_format", responseFormat);
            return JSON.writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalArgumentException("Ошибка подготовки запроса к OpenRouter: " + e.getMessage());
        }
    }

    /** Разбирает JSON-ответ модели в список сгенерированных вариантов. */
    private static List<GeneratedVariant> parseDetailedVariants(String responseBody, int count) throws IOException {
        JsonNode root = JSON.readTree(responseBody);
        String text = extractText(root);
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("OpenRouter вернул пустой ответ.");
        }
        String cleaned = stripCodeFences(text);
        JsonNode parsed = JSON.readTree(cleaned);
        JsonNode arr = parsed.get("variants");
        if (arr == null || !arr.isArray()) {
            throw new IllegalArgumentException("OpenRouter вернул неверный JSON: нет массива variants.");
        }
        List<GeneratedVariant> out = new ArrayList<>();
        for (JsonNode it : arr) {
            String content = it.path("content").asText("").trim();
            if (content.isBlank()) {
                continue;
            }
            List<GeneratedCase> publicTests = parseCases(it.path("public_tests"), EXPECTED_PUBLIC_TESTS);
            List<GeneratedCase> privateTests = parseCases(it.path("private_tests"), EXPECTED_PRIVATE_TESTS);
            if (publicTests.size() < EXPECTED_PUBLIC_TESTS || privateTests.size() < EXPECTED_PRIVATE_TESTS) {
                throw new IllegalArgumentException(
                        String.format(
                                "Модель вернула недостаточно тест-кейсов: нужно %d открытых и %d закрытых, получено %d и %d.",
                                EXPECTED_PUBLIC_TESTS,
                                EXPECTED_PRIVATE_TESTS,
                                publicTests.size(),
                                privateTests.size()));
            }
            out.add(new GeneratedVariant(content, publicTests, privateTests));
            if (out.size() >= count) {
                break;
            }
        }
        if (out.isEmpty()) {
            throw new IllegalArgumentException("OpenRouter не вернул текст вариантов.");
        }
        return out;
    }

    /** Разбирает массив примеров/тестов из JSON-узла. */
    private static List<GeneratedCase> parseCases(JsonNode node, int max) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<GeneratedCase> out = new ArrayList<>();
        for (JsonNode it : node) {
            String in = it.path("input").asText("").trim();
            String outTxt = it.path("output").asText("").trim();
            if (in.isBlank() && outTxt.isBlank()) {
                continue;
            }
            out.add(new GeneratedCase(in, outTxt));
            if (out.size() >= max) {
                break;
            }
        }
        return out;
    }

    /** Извлекает текст контента из формата OpenRouter choices/message/content. */
    private static String extractText(JsonNode root) {
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            return null;
        }
        JsonNode contentNode = choices.get(0).path("message").path("content");
        if (contentNode.isTextual()) {
            return contentNode.asText();
        }
        if (contentNode.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode part : contentNode) {
                String t = part.path("text").asText("");
                if (!t.isBlank()) {
                    if (sb.length() > 0) {
                        sb.append('\n');
                    }
                    sb.append(t);
                }
            }
            return sb.toString();
        }
        return contentNode.toString();
    }

    /** Удаляет markdown-ограждения кода из ответа, если они присутствуют. */
    private static String stripCodeFences(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            int firstNl = t.indexOf('\n');
            if (firstNl > -1) {
                t = t.substring(firstNl + 1);
            }
            int endFence = t.lastIndexOf("```");
            if (endFence >= 0) {
                t = t.substring(0, endFence);
            }
        }
        return t.trim();
    }
}
