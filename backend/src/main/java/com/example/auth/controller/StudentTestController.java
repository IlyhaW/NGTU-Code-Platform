package com.example.auth.controller;

import com.example.auth.dto.CompleteStudentTestRequest;
import com.example.auth.dto.CurrentUserDto;
import com.example.auth.dto.SaveStudentTestAnswerRequest;
import com.example.auth.dto.StudentCompletedTestReviewDto;
import com.example.auth.dto.StudentTestDetailDto;
import com.example.auth.dto.StudentTestListItemDto;
import com.example.auth.dto.TestAnswerCheckDto;
import com.example.auth.service.AuthService;
import com.example.auth.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200"})
/**
 * Контроллер прохождения и просмотра тестов студентом.
 */
public class StudentTestController extends ControllerAuthSupport {
    private final TestService testService;

    /**
     * Создает контроллер тестов студента.
     */
    public StudentTestController(AuthService authService, TestService testService) {
        super(authService);
        this.testService = testService;
    }

    /**
     * Возвращает активные тесты студента.
     */
    @GetMapping("/student/tests/current")
    public ResponseEntity<List<StudentTestListItemDto>> listStudentCurrentTests(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return ResponseEntity.ok(testService.listCurrentTestsForStudent(user.getId()));
    }

    /**
     * Возвращает тесты студента, запланированные на будущее.
     */
    @GetMapping("/student/tests/upcoming")
    public ResponseEntity<List<StudentTestListItemDto>> listStudentUpcomingTests(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return ResponseEntity.ok(testService.listUpcomingTestsForStudent(user.getId()));
    }

    /**
     * Возвращает список завершенных тестов студента.
     */
    @GetMapping("/student/tests/completed")
    public ResponseEntity<List<StudentTestListItemDto>> listStudentCompletedTests(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return ResponseEntity.ok(testService.listCompletedTestsForStudent(user.getId()));
    }

    /**
     * Возвращает детальный обзор завершенного теста студента.
     */
    @GetMapping("/student/tests/{testId}/completed-review")
    public ResponseEntity<StudentCompletedTestReviewDto> getStudentCompletedTestReview(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("testId") Long testId) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return testService
                .getCompletedTestReviewForStudent(user.getId(), testId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Завершает прохождение теста студентом.
     */
    @PostMapping("/student/tests/{testId}/complete")
    public ResponseEntity<Void> completeStudentTest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("testId") Long testId,
            @RequestBody(required = false) CompleteStudentTestRequest body) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        Integer total =
                body != null && body.getTotalTimeSeconds() != null && body.getTotalTimeSeconds() >= 0
                        ? body.getTotalTimeSeconds()
                        : null;
        if (!testService.completeTestForStudent(user.getId(), testId, total)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Возвращает тест для текущего прохождения студентом.
     */
    @GetMapping("/student/tests/{id}")
    public ResponseEntity<StudentTestDetailDto> getStudentTest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return testService
                .getDetailForStudent(user.getId(), id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Сохраняет ответ студента на вопрос теста.
     */
    @PutMapping("/student/tests/{testId}/answers")
    public ResponseEntity<Void> saveStudentTestAnswer(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("testId") Long testId,
            @RequestBody SaveStudentTestAnswerRequest body) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        try {
            if (!testService.saveStudentAnswer(
                    user.getId(),
                    testId,
                    body.getTestQuestionId(),
                    body.getContent(),
                    body.getTimeSpentSeconds())) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Запускает автоматическую проверку ответа студента.
     */
    @PostMapping("/student/tests/{testId}/answers/{testQuestionId}/check")
    public ResponseEntity<TestAnswerCheckDto> checkStudentTestAnswer(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("testId") Long testId,
            @PathVariable("testQuestionId") Long testQuestionId) {
        AccessDecision auth = requireRole(authorization, "student", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return testService
                .checkStudentAnswer(user.getId(), testId, testQuestionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
