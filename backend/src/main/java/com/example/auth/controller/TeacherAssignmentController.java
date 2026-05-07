package com.example.auth.controller;

import com.example.auth.dto.AssignmentDetailDto;
import com.example.auth.dto.AssignmentDto;
import com.example.auth.dto.CreateTaskRequest;
import com.example.auth.dto.CreateTaskTestCaseRequest;
import com.example.auth.dto.CreateVariantRequest;
import com.example.auth.dto.CurrentUserDto;
import com.example.auth.dto.GenerateVariantsRequest;
import com.example.auth.dto.TaskDetailDto;
import com.example.auth.dto.TaskTestCaseDto;
import com.example.auth.dto.TaskTestCasesViewDto;
import com.example.auth.dto.UpdateAssignmentRequest;
import com.example.auth.dto.UpdateVariantRequest;
import com.example.auth.dto.VariantDetailDto;
import com.example.auth.service.AssignmentService;
import com.example.auth.service.AuthService;
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

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200"})
/**
 * Контроллер управления темами, задачами и вариантами преподавателя.
 */
public class TeacherAssignmentController extends ControllerAuthSupport {
    private final AssignmentService assignmentService;

    /**
     * Создает контроллер работы с учебными материалами преподавателя.
     */
    public TeacherAssignmentController(AuthService authService, AssignmentService assignmentService) {
        super(authService);
        this.assignmentService = assignmentService;
    }

    /**
     * Возвращает список тем преподавателя.
     */
    @GetMapping("/assignments")
    public ResponseEntity<List<AssignmentDto>> getAssignments(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", false);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (user.getId() == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(assignmentService.findAllByTeacherId(user.getId()));
    }

    /**
     * Возвращает детальную информацию по теме.
     */
    @GetMapping("/assignments/{id}")
    public ResponseEntity<AssignmentDetailDto> getAssignment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true, 404);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return assignmentService.findByIdAndTeacherId(id, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).build());
    }

    /**
     * Создает новую тему преподавателя.
     */
    @PostMapping(value = "/assignments", consumes = "application/json")
    public ResponseEntity<AssignmentDetailDto> createAssignment(
            @RequestBody(required = false) UpdateAssignmentRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return ResponseEntity.ok(assignmentService.createAssignment(user.getId(), request));
    }

    /**
     * Обновляет тему по идентификатору.
     */
    @PutMapping(value = "/assignments/{id}", consumes = "application/json")
    public ResponseEntity<Void> updateAssignment(
            @PathVariable Long id,
            @RequestBody UpdateAssignmentRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return doUpdateAssignment(id, request, authorization);
    }

    /**
     * Обновляет тему через POST-маршрут совместимости.
     */
    @PostMapping(value = "/assignments/{id}/update", consumes = "application/json")
    public ResponseEntity<Void> updateAssignmentPost(
            @PathVariable Long id,
            @RequestBody UpdateAssignmentRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return doUpdateAssignment(id, request, authorization);
    }

    /**
     * Выполняет обновление темы и возвращает итоговый HTTP-статус.
     */
    private ResponseEntity<Void> doUpdateAssignment(Long id, UpdateAssignmentRequest request, String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (assignmentService.updateAssignment(id, user.getId(), request)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(404).build();
    }

    /**
     * Удаляет тему преподавателя.
     */
    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (assignmentService.deleteAssignment(id, user.getId())) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(404).build();
    }

    /**
     * Возвращает задачу внутри темы.
     */
    @GetMapping("/assignments/{assignmentId}/tasks/{taskId}")
    public ResponseEntity<TaskDetailDto> getTask(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true, 404);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return assignmentService.findTaskByIdAndTeacherId(assignmentId, taskId, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).build());
    }

    /**
     * Создает задачу в выбранной теме.
     */
    @PostMapping(value = "/assignments/{id}/tasks", consumes = "application/json")
    public ResponseEntity<TaskDetailDto> createTask(
            @PathVariable Long id,
            @RequestBody CreateTaskRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        try {
            TaskDetailDto created = assignmentService.createTask(id, user.getId(), request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).build();
        }
    }

    /**
     * Обновляет формулировку задачи.
     */
    @PutMapping(value = "/assignments/{assignmentId}/tasks/{taskId}", consumes = "application/json")
    public ResponseEntity<Void> updateTask(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @RequestBody CreateTaskRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (assignmentService.updateTaskTitle(assignmentId, taskId, user.getId(), request)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(404).build();
    }

    /**
     * Удаляет задачу из темы.
     */
    @DeleteMapping("/assignments/{assignmentId}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (assignmentService.deleteTask(assignmentId, taskId, user.getId())) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(404).build();
    }

    /**
     * Генерирует варианты решения для задачи.
     */
    @PostMapping(value = "/assignments/{assignmentId}/tasks/{taskId}/generate-variants", consumes = "application/json")
    public ResponseEntity<List<VariantDetailDto>> generateVariants(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @RequestBody GenerateVariantsRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        List<VariantDetailDto> created = assignmentService.generateVariants(
                assignmentId, taskId, user.getId(), request);
        return ResponseEntity.ok(created);
    }

    /**
     * Возвращает выбранный вариант задачи.
     */
    @GetMapping("/assignments/{assignmentId}/tasks/{taskId}/variants/{variantId}")
    public ResponseEntity<VariantDetailDto> getVariant(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @PathVariable Long variantId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true, 404);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return assignmentService.getVariant(assignmentId, taskId, variantId, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).build());
    }

    /**
     * Возвращает тест-кейсы для выбранного варианта задачи.
     */
    @GetMapping("/assignments/{assignmentId}/tasks/{taskId}/variants/{variantId}/test-cases")
    public ResponseEntity<TaskTestCasesViewDto> getTaskTestCases(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @PathVariable Long variantId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true, 404);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return assignmentService.getTaskTestCases(assignmentId, taskId, variantId, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).build());
    }

    /**
     * Добавляет тест-кейс к варианту задачи.
     */
    @PostMapping(value = "/assignments/{assignmentId}/tasks/{taskId}/variants/{variantId}/test-cases", consumes = "application/json")
    public ResponseEntity<TaskTestCaseDto> addTaskTestCase(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @PathVariable Long variantId,
            @RequestBody(required = false) CreateTaskTestCaseRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true, 404);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        return assignmentService.addTaskTestCase(assignmentId, taskId, variantId, user.getId(), request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).build());
    }

    /**
     * Удаляет тест-кейс из варианта задачи.
     */
    @DeleteMapping("/assignments/{assignmentId}/tasks/{taskId}/variants/{variantId}/test-cases/{testCaseId}")
    public ResponseEntity<Void> deleteTaskTestCase(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @PathVariable Long variantId,
            @PathVariable Long testCaseId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true, 404);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (!assignmentService.deleteTaskTestCase(assignmentId, taskId, variantId, testCaseId, user.getId())) {
            return ResponseEntity.status(404).build();
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Создает вариант задачи.
     */
    @PostMapping(value = "/assignments/{assignmentId}/tasks/{taskId}/variants", consumes = "application/json")
    public ResponseEntity<VariantDetailDto> createVariant(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @RequestBody CreateVariantRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        try {
            VariantDetailDto created = assignmentService.createVariant(assignmentId, taskId, user.getId(), request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).build();
        }
    }

    /**
     * Обновляет вариант задачи.
     */
    @PutMapping(value = "/assignments/{assignmentId}/tasks/{taskId}/variants/{variantId}", consumes = "application/json")
    public ResponseEntity<Void> updateVariant(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @PathVariable Long variantId,
            @RequestBody UpdateVariantRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (assignmentService.updateVariant(assignmentId, taskId, variantId, user.getId(), request)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(404).build();
    }

    /**
     * Удаляет вариант задачи.
     */
    @DeleteMapping("/assignments/{assignmentId}/tasks/{taskId}/variants/{variantId}")
    public ResponseEntity<Void> deleteVariant(
            @PathVariable Long assignmentId,
            @PathVariable Long taskId,
            @PathVariable Long variantId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", true);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        CurrentUserDto user = auth.user();
        if (assignmentService.deleteVariant(assignmentId, taskId, variantId, user.getId())) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(404).build();
    }
}
