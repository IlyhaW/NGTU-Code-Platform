package com.example.auth.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
/**
 * Глобальный обработчик исключений REST-слоя.
 */
public class RestExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

    /**
     * Преобразует ошибки входных данных в ответ 400.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }

    /**
     * Преобразует конфликт состояния бизнес-операции в ответ 409.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", ex.getMessage()));
    }

    /**
     * Возвращает 400 при некорректном JSON в теле запроса.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleBadJson(HttpMessageNotReadableException ex) {
        Throwable c = ex.getMostSpecificCause();
        String detail = c != null && c.getMessage() != null ? c.getMessage() : ex.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Некорректное тело запроса: " + (detail != null ? detail : ex.getClass().getSimpleName())));
    }

    /**
     * Возвращает 409 при нарушении ограничений базы данных.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        Throwable c = ex.getMostSpecificCause();
        String detail = c != null && c.getMessage() != null ? c.getMessage() : ex.getMessage();
        log.warn("DataIntegrityViolation: {}", detail);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Нарушение ограничений БД (группы, задания или внешние ключи). " + (detail != null ? detail : "")));
    }

    /**
     * Возвращает 500 для необработанных ошибок приложения.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        log.error("Unhandled server error", ex);
        Throwable c = ex.getCause() != null ? ex.getCause() : ex;
        String msg = c.getMessage() != null ? c.getMessage() : ex.getClass().getSimpleName();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", msg));
    }
}

