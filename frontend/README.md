# NGTU Code Platform Frontend

Клиентское приложение на Angular для работы преподавателей и студентов с платформой.

## Стек

- Angular 17 (standalone components)
- TypeScript
- RxJS

## Запуск

```bash
npm install
npm start
```

Приложение доступно на `http://localhost:4200`.

## Сборка

```bash
npm run build
```

Build-артефакты: `dist/ngtu-code-platform-frontend`.

## Подключение к API

Базовый URL API задается в `src/environments/environment.ts` (`apiUrl`).
По умолчанию: `http://localhost:8080/api/auth`.
Перед запуском клиента убедитесь, что backend доступен.

