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
 * Генератор вариантов задач через OpenRouter API.
 */
public class AiVariantGenerator {
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
    public AiVariantGenerator(
            @Value("${openrouter.api-key:}") String apiKey,
            @Value("${openrouter.model}") String configuredModel,
            @Value("${openrouter.referer:http://localhost}") String referer,
            @Value("${openrouter.app-title:auth-zero}") String appTitle) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.configuredModel = configuredModel != null ? configuredModel.trim() : "";
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
            String solutionAlgorithm,
            String inputFormat,
            String outputFormat,
            int count,
            int difficulty,
            String style) {
        List<GeneratedVariant> detailed =
                generateDetailed(
                        assignmentName,
                        taskTitle,
                        sourceText,
                        solutionAlgorithm,
                        inputFormat,
                        outputFormat,
                        count,
                        difficulty,
                        style);
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
            String solutionAlgorithm,
            String inputFormat,
            String outputFormat,
            int count,
            int difficulty,
            String style) {
        if (apiKey.isBlank()) {
            throw new IllegalArgumentException(
                    "Не задан OpenRouter API key. Укажите openrouter.api-key в application.properties или переменной окружения.");
        }
        if (configuredModel.isBlank()) {
            throw new IllegalArgumentException(
                    "Не задана модель OpenRouter. Укажите OPENROUTER_MODEL в .env/docker-compose.yml или openrouter.model в application.properties.");
        }
        String algorithm = solutionAlgorithm == null ? "" : solutionAlgorithm.trim();
        if (algorithm.isBlank()) {
            throw new IllegalArgumentException("Алгоритм решения не задан.");
        }
        String prompt =
                buildDetailedPrompt(
                        assignmentName,
                        taskTitle,
                        sourceText,
                        algorithm,
                        inputFormat,
                        outputFormat,
                        count,
                        difficulty,
                        style);
        String body = requestBody(prompt, configuredModel);
        HttpRequest req =
                HttpRequest.newBuilder()
                        .uri(URI.create(OPENROUTER_URL))
                        .timeout(Duration.ofSeconds(120))
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
            String assignmentName,
            String taskTitle,
            String sourceText,
            String solutionAlgorithm,
            String inputFormat,
            String outputFormat,
            int count,
            int difficulty,
            String style) {
        String styleInstruction = buildStyleInstruction(style);
        String inputFmt = inputFormat == null || inputFormat.isBlank() ? "не задан, выведи из условия" : inputFormat.trim();
        String outputFmt = outputFormat == null || outputFormat.isBlank() ? "не задан, выведи из условия" : outputFormat.trim();
        return """
                Ты помогаешь преподавателю составлять варианты задач по программированию и автотесты к ним.
                Верни результат строго в JSON без markdown и пояснений:
                {"variants":[{"name":"Вариант 1","content":"...","public_tests":[{"input":"...","output":"..."}],"private_tests":[{"input":"...","output":"..."}]}]}

                Общие требования:
                - Язык: весь ответ только на русском. Поля name, content, а также все input и output в public_tests и private_tests — на русском (кроме имён переменных/функций в коде, если он есть внутри теста).
                - Количество вариантов: %d
                - Сложность: %d из 5
                - Тематика курса: %s
                - Название задачи: %s
                - %s

                Алгоритм решения (единый для ВСЕХ вариантов этой задачи, включая новые):
                ---
                %s
                ---
                Этот алгоритм — эталон проверки. Для каждого тест-кейса каждого варианта:
                1) сформируй input в контексте сюжета варианта;
                2) вычисли output, строго применив алгоритм к input (описание, формула, псевдокод — как указано выше);
                3) не подбирай output «на глаз» и не копируй примеры из условия без пересчёта.

                Формат входных данных (для тестов): %s
                Формат выходных данных (для тестов): %s

                Основной текст исходного варианта:
                ---
                %s
                ---

                Варианты условий:
                - Каждый вариант — самодостаточный текст (что дано, что требуется, формат ввода/вывода при необходимости).
                - Варианты должны сохранять ту же вычислительную суть, что исходник, но отличаться сюжетом, числами и формулировками.
                - Поле content: только полный текст условия (без markdown). Не включай в content примеры ввода-вывода, секции «Пример», «Вход», «Выход» — любые демонстрационные пары только в public_tests и private_tests.

                Тест-кейсы (для каждого варианта отдельно):
                - public_tests: ровно %d открытых тест-кейсов (видны студенту).
                - private_tests: ровно %d закрытых тест-кейсов.
                - input должен быть реалистичен для сюжета варианта (например, дневная температура на улице — разумный диапазон примерно от −45 до +50 °C, а не от −1000 до +2000; цены в магазине — положительные и правдоподобные).
                - output должен точно следовать из алгоритма решения при данных input; перед ответом мысленно перепроверь каждую пару.
                - public_tests и private_tests: пары input/output в plain text, без markdown; наборы input между вариантами должны различаться.

                Самопроверка перед ответом:
                - Для каждого варианта примени алгоритм решения ко всем input и убедись, что output согласован.
                - Новые варианты должны быть проверяемы тем же алгоритмом, что и исходник.
                """.formatted(
                count,
                difficulty,
                safe(assignmentName),
                safe(taskTitle),
                styleInstruction,
                safe(solutionAlgorithm),
                inputFmt,
                outputFmt,
                safe(sourceText),
                EXPECTED_PUBLIC_TESTS,
                EXPECTED_PRIVATE_TESTS);
    }

    /** Формирует инструкцию по стилю: при пустом поле — разнообразные сюжеты. */
    private static String buildStyleInstruction(String style) {
        if (style == null || style.isBlank()) {
            return """
                    Стиль формулировки: не задан. Сделай варианты ярко разными по сюжету и обстановке \
                    (например: рынок, городской парк, космическая станция, школьный класс, спортивный зал, \
                    библиотека, ферма, метро и т.д.). Не повторяй одну обстановку в двух вариантах. \
                    Формулировки должны быть живыми и интересными, но сохранять одну вычислительную задачу.""";
        }
        return "Стиль формулировки (единый для всех вариантов): " + style.trim();
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
            root.put("temperature", 0.7);

            com.fasterxml.jackson.databind.node.ArrayNode messages = JSON.createArrayNode();
            com.fasterxml.jackson.databind.node.ObjectNode system = JSON.createObjectNode();
            system.put("role", "system");
            system.put(
                    "content",
                    """
                    Отвечай строго JSON-объектом формата {"variants":[{"name":"...","content":"...","public_tests":[{"input":"...","output":"..."}],"private_tests":[{"input":"...","output":"..."}]}]}.
                    Только русский язык во всех текстовых полях. Выходы тестов вычисляй по заданному алгоритму решения, а не угадывай.
                    Входы тестов должны соответствовать сюжету варианта. Без примеров внутри content.""");
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
