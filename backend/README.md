# Backend (Spring Boot)

Краткая справка по backend-части. Общий запуск проекта и архитектура — в корневом `README.md`.

## Локальный запуск API

```bash
mvn spring-boot:run
```

API: `http://localhost:8080/api/auth`

## Переменные окружения

- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET_BASE64` (обязательно)
- `OPENROUTER_API_KEY` (опционально)

Шаблон: `.env.example`.