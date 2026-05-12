package com.example.auth.service;

import com.example.auth.dto.CurrentUserDto;
import com.example.auth.dto.LoginResponse;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.GroupEntity;
import com.example.auth.entity.User;
import com.example.auth.repository.GroupRepository;
import com.example.auth.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@Service
/**
 * Сервис регистрации, аутентификации и чтения текущего пользователя.
 */
public class AuthService {
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    /**
     * Создает сервис аутентификации.
     */
    public AuthService(
            UserRepository userRepository,
            GroupRepository groupRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    /**
     * Регистрирует нового пользователя и возвращает его профиль.
     */
    public UserResponse register(RegisterRequest request) {
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            throw new IllegalArgumentException("login is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("password is required");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new IllegalArgumentException("fullName is required");
        }
        if (!"student".equals(request.getRole()) && !"teacher".equals(request.getRole())) {
            throw new IllegalArgumentException("role must be 'student' or 'teacher'");
        }
        if (userRepository.existsByLogin(request.getLogin())) {
            throw new IllegalStateException("login already exists");
        }

        GroupEntity group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new IllegalArgumentException("group not found"));
        }

        String bcryptHash = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setLogin(request.getLogin());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setGroup(group);
        user.setPasswordHash(bcryptHash.getBytes(StandardCharsets.UTF_8));

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    /**
     * Выполняет вход пользователя и возвращает JWT-токен.
     */
    public LoginResponse login(String login, String password) {
        if (login == null || login.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("login and password are required");
        }
        User user = userRepository
                .findByLoginWithGroup(login.trim())
                .orElseThrow(() -> new IllegalArgumentException("user not found"));

        String storedHash = new String(user.getPasswordHash(), StandardCharsets.UTF_8);
        if (!passwordEncoder.matches(password, storedHash)) {
            throw new IllegalArgumentException("invalid password");
        }

        String token = jwtTokenService.createToken(user);
        return new LoginResponse(token, user.getRole());
    }

    /**
     * Возвращает список учебных групп.
     */
    public List<GroupEntity> getGroups() {
        return groupRepository.findAll();
    }

    /**
     * Извлекает пользователя из заголовка Authorization и возвращает его данные.
     */
    public CurrentUserDto getCurrentUser(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new IllegalArgumentException("missing or invalid Authorization header");
        }
        String token = bearerToken.substring(7).trim();
        if (token.isEmpty()) {
            throw new IllegalArgumentException("empty token");
        }
        Claims claims = jwtTokenService.parseToken(token);
        CurrentUserDto dto = new CurrentUserDto();
        Object userId = claims.get("userId");
        if (userId instanceof Number) {
            dto.setId(((Number) userId).longValue());
        } else {
            String login = claims.getSubject();
            if (login != null && !login.isBlank()) {
                userRepository.findByLoginWithGroup(login.trim()).ifPresent(u -> dto.setId(u.getId()));
            }
        }
        dto.setFullName(claims.get("fullName", String.class));
        dto.setRole(claims.get("role", String.class));
        enrichCurrentUserGroup(dto, claims);
        return dto;
    }

    /** Подставляет название группы из БД; если в профиле группы нет — из claim groupName в JWT (после входа). */
    private void enrichCurrentUserGroup(CurrentUserDto dto, Claims claims) {
        Optional<User> withGroup = Optional.empty();
        if (dto.getId() != null) {
            withGroup = userRepository.findByIdWithGroup(dto.getId());
        }
        if (withGroup.isEmpty()) {
            String login = claims.getSubject();
            if (login != null && !login.isBlank()) {
                withGroup = userRepository.findByLoginWithGroup(login.trim());
            }
        }
        if (withGroup.isPresent()) {
            User u = withGroup.get();
            if (u.getGroup() != null
                    && u.getGroup().getName() != null
                    && !u.getGroup().getName().isBlank()) {
                dto.setGroupName(u.getGroup().getName().trim());
                return;
            }
        }
        String fromJwt = claims.get("groupName", String.class);
        if (fromJwt != null && !fromJwt.isBlank()) {
            dto.setGroupName(fromJwt.trim());
        } else {
            dto.setGroupName(null);
        }
    }

    /**
     * Преобразует сущность пользователя в DTO ответа API.
     */
    private static UserResponse toResponse(User user) {
        UserResponse resp = new UserResponse();
        resp.setId(user.getId());
        resp.setLogin(user.getLogin());
        resp.setFullName(user.getFullName());
        resp.setRole(user.getRole());
        resp.setGroupId(user.getGroup() != null ? user.getGroup().getId() : null);
        return resp;
    }
}

