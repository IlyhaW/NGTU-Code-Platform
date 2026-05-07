package com.example.auth.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Фильтр обработки CORS preflight-запросов.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsPreflightFilter extends OncePerRequestFilter {

    /**
     * Обрабатывает OPTIONS-запросы и добавляет CORS-заголовки.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            addCorsHeaders(request, response);
            return;
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Добавляет CORS-заголовки в HTTP-ответ.
     */
    private void addCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isEmpty()) {
            origin = "http://localhost:4200";
        }
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Max-Age", "3600");
        String allowHeaders = request.getHeader("Access-Control-Request-Headers");
        if (allowHeaders != null && !allowHeaders.isEmpty()) {
            response.setHeader("Access-Control-Allow-Headers", allowHeaders);
        } else {
            response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
        }
    }
}
