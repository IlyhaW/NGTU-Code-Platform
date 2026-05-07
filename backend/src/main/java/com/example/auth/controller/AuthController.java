package com.example.auth.controller;

import com.example.auth.dto.CurrentUserDto;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.LoginResponse;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.GroupEntity;
import com.example.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200"})
/**
 * Контроллер базовой аутентификации и справочных данных.
 */
public class AuthController {
    private final AuthService authService;

    /**
     * Создает контроллер с зависимостью на сервис аутентификации.
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Регистрирует нового пользователя.
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * Выполняет вход пользователя и возвращает JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request.getLogin(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    /**
     * Возвращает профиль текущего пользователя по заголовку Authorization.
     */
    @GetMapping("/me")
    public ResponseEntity<CurrentUserDto> getMe(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        try {
            CurrentUserDto user = authService.getCurrentUser(authorization);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    /**
     * Возвращает список учебных групп.
     */
    @GetMapping("/groups")
    public ResponseEntity<List<GroupEntity>> getGroups() {
        return ResponseEntity.ok(authService.getGroups());
    }

}

