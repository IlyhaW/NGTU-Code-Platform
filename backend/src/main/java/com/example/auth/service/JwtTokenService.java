package com.example.auth.service;

import com.example.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
/**
 * Сервис выпуска и валидации JWT-токенов.
 */
public class JwtTokenService {
    private final Key jwtKey;
    private final long jwtExpirationMs;

    /**
     * Инициализирует сервис JWT на основе конфигурации приложения.
     */
    public JwtTokenService(
            @Value("${jwt.secret-base64}") String jwtSecretBase64,
            @Value("${jwt.expiration-ms}") long jwtExpirationMs
    ) {
        this.jwtKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecretBase64));
        this.jwtExpirationMs = jwtExpirationMs;
    }

    /**
     * Создает JWT-токен для указанного пользователя.
     */
    public String createToken(User user) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + jwtExpirationMs);
        return Jwts.builder()
                .setSubject(user.getLogin())
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole())
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(jwtKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Проверяет токен и возвращает его claims.
     */
    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(jwtKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
