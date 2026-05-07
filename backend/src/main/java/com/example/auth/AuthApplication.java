package com.example.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Точка входа backend-приложения NGTU Code Platform.
 */
@SpringBootApplication
public class AuthApplication {
    /**
     * Запускает Spring Boot приложение.
     *
     * @param args аргументы командной строки
     */
    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}

