package com.example.auth.controller;

import com.example.auth.dto.CreateTestRequest;
import com.example.auth.dto.CurrentUserDto;
import com.example.auth.dto.TestAnalyticsDto;
import com.example.auth.dto.TestCreatedDto;
import com.example.auth.dto.TestDetailDto;
import com.example.auth.dto.TestListItemDto;
import com.example.auth.dto.TestSubmissionsDto;
import com.example.auth.service.AuthService;
import com.example.auth.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200"})
/**
 * Контроллер управления тестами преподавателя.
 */
public class TeacherTestController extends ControllerAuthSupport {
    private final TestService testService;

    /**
     * Создает контроллер тестов преподавателя.
     */
    public TeacherTestController(AuthService authService, TestService testService) {
        super(authService);
        this.testService = testService;
    }

    /**
     * Проверяет доступность API тестов.
     */
    @GetMapping("/tests/ping")
    public ResponseEntity<Map<String, String>> testsPing() {
        return ResponseEntity.ok(Map.of("testsApi", "ok"));
    }

    /**
     * Создает новый тест преподавателя.
     */
    @PostMapping({"/tests", "/create-test"})
    public ResponseEntity<TestCreatedDto> createTest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody CreateTestRequest body) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        TestCreatedDto created = testService.create(user.getId(), body);
        return ResponseEntity.ok(created);
    }

    /**
     * Возвращает список тестов преподавателя.
     */
    @GetMapping("/tests/list")
    public ResponseEntity<List<TestListItemDto>> listTests(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return ResponseEntity.ok(testService.listForTeacher(user.getId()));
    }

    /**
     * Возвращает детальную информацию по тесту преподавателя.
     */
    @GetMapping("/tests/{id}")
    public ResponseEntity<TestDetailDto> getTest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return testService
                .getDetail(user.getId(), id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Возвращает ответы студентов по выбранному тесту.
     */
    @GetMapping("/tests/{id}/submissions")
    public ResponseEntity<TestSubmissionsDto> getTestSubmissions(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return testService
                .getSubmissionsForTeacher(user.getId(), id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Возвращает агрегированную аналитику по тесту.
     */
    @GetMapping("/tests/{id}/analytics")
    public ResponseEntity<TestAnalyticsDto> getTestAnalytics(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return testService
                .getTestAnalyticsForTeacher(user.getId(), id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Обновляет существующий тест преподавателя.
     */
    @PutMapping("/tests/{id}")
    public ResponseEntity<TestCreatedDto> updateTest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id,
            @RequestBody CreateTestRequest body) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        try {
            return ResponseEntity.ok(testService.update(user.getId(), id, body));
        } catch (IllegalArgumentException ex) {
            if ("test not found".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    /**
     * Удаляет тест преподавателя.
     */
    @DeleteMapping("/tests/{id}")
    public ResponseEntity<Void> deleteTest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        try {
            testService.deleteForTeacher(user.getId(), id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            if ("test not found".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }
}
