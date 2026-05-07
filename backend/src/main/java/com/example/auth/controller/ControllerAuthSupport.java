package com.example.auth.controller;

import com.example.auth.dto.CurrentUserDto;
import com.example.auth.service.AuthService;
import org.springframework.http.ResponseEntity;

/**
 * Базовый вспомогательный класс контроллеров для проверки роли пользователя.
 */
abstract class ControllerAuthSupport {
    private final AuthService authService;

    /**
     * Создает helper для проверки доступа на основе токена.
     */
    protected ControllerAuthSupport(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Проверяет роль пользователя и возвращает результат проверки доступа.
     */
    protected AccessDecision requireRole(String authorization, String role, boolean requireUserId) {
        return requireRole(authorization, role, requireUserId, 403);
    }

    /**
     * Проверяет роль пользователя с настраиваемым статусом при запрете доступа.
     */
    protected AccessDecision requireRole(String authorization, String role, boolean requireUserId, int forbiddenStatus) {
        if (authorization == null || authorization.isBlank()) {
            return AccessDecision.denied(401);
        }
        final CurrentUserDto user;
        try {
            user = authService.getCurrentUser(authorization);
        } catch (Exception e) {
            return AccessDecision.denied(401);
        }
        if (user == null || !role.equalsIgnoreCase(user.getRole())) {
            return AccessDecision.denied(forbiddenStatus);
        }
        if (requireUserId && user.getId() == null) {
            return AccessDecision.denied(forbiddenStatus);
        }
        return AccessDecision.allowed(user);
    }

    /**
     * Результат проверки доступа пользователя к endpoint.
     */
    protected record AccessDecision(CurrentUserDto user, Integer deniedStatus) {
        /**
         * Создает успешный результат проверки с текущим пользователем.
         */
        static AccessDecision allowed(CurrentUserDto user) {
            return new AccessDecision(user, null);
        }

        /**
         * Создает результат отказа с HTTP-статусом.
         */
        static AccessDecision denied(int statusCode) {
            return new AccessDecision(null, statusCode);
        }

        /**
         * Возвращает признак отказа в доступе.
         */
        boolean isDenied() {
            return deniedStatus != null;
        }

        /**
         * Формирует HTTP-ответ с кодом отказа.
         */
        <T> ResponseEntity<T> deniedResponse() {
            return ResponseEntity.status(deniedStatus).build();
        }
    }
}
