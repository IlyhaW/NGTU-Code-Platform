package com.example.auth.controller;

import com.example.auth.dto.CreateGroupRequest;
import com.example.auth.dto.CurrentUserDto;
import com.example.auth.dto.GroupMemberDto;
import com.example.auth.dto.GroupSummaryDto;
import com.example.auth.dto.RemoveGroupMemberRequest;
import com.example.auth.service.AuthService;
import com.example.auth.service.GroupManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
 * Контроллер управления учебными группами преподавателя.
 */
public class TeacherGroupController extends ControllerAuthSupport {
    private final GroupManagementService groupManagementService;

    /**
     * Создает контроллер групп преподавателя.
     */
    public TeacherGroupController(AuthService authService, GroupManagementService groupManagementService) {
        super(authService);
        this.groupManagementService = groupManagementService;
    }

    /**
     * Возвращает сводный список учебных групп.
     */
    @GetMapping("/teacher/groups")
    public ResponseEntity<List<GroupSummaryDto>> teacherListGroups(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AccessDecision auth = requireRole(authorization, "teacher", false);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        return ResponseEntity.ok(groupManagementService.listSummaries());
    }

    /**
     * Возвращает участников выбранной группы.
     */
    @GetMapping("/teacher/groups/{id}/members")
    public ResponseEntity<List<GroupMemberDto>> teacherListGroupMembers(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id) {
        AccessDecision auth = requireRole(authorization, "teacher", false);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        try {
            return ResponseEntity.ok(groupManagementService.listMembers(id));
        } catch (IllegalArgumentException ex) {
            if ("group not found".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    /**
     * Создает новую учебную группу.
     */
    @PostMapping("/teacher/groups")
    public ResponseEntity<GroupSummaryDto> teacherCreateGroup(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody CreateGroupRequest body) {
        AccessDecision auth = requireRole(authorization, "teacher", false);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        return ResponseEntity.ok(groupManagementService.create(body));
    }

    /**
     * Удаляет группу по идентификатору.
     */
    @DeleteMapping("/teacher/groups/{id}")
    public ResponseEntity<Void> teacherDeleteGroup(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") Long id) {
        AccessDecision auth = requireRole(authorization, "teacher", false);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        try {
            groupManagementService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            if ("group not found".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    /**
     * Удаляет участника из группы через DELETE-маршрут.
     */
    @DeleteMapping("/teacher/groups/{groupId}/members/{userId}")
    public ResponseEntity<Void> teacherRemoveGroupMember(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("groupId") Long groupId,
            @PathVariable("userId") Long userId) {
        return doRemoveGroupMember(authorization, groupId, userId);
    }

    /**
     * Удаляет участника из группы через POST-маршрут.
     */
    @PostMapping("/teacher/groups/{groupId}/members/{userId}/remove")
    public ResponseEntity<Void> teacherRemoveGroupMemberPost(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("groupId") Long groupId,
            @PathVariable("userId") Long userId) {
        return doRemoveGroupMember(authorization, groupId, userId);
    }

    /**
     * Удаляет участника из группы через плоский JSON-маршрут.
     */
    @PostMapping(value = "/teacher/groups/remove-member", consumes = "application/json")
    public ResponseEntity<Void> teacherRemoveGroupMemberFlat(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody RemoveGroupMemberRequest body) {
        if (body == null || body.getGroupId() == null || body.getUserId() == null) {
            return ResponseEntity.badRequest().build();
        }
        return doRemoveGroupMember(authorization, body.getGroupId(), body.getUserId());
    }

    /**
     * Выполняет удаление участника из группы и маппит типовые ошибки.
     */
    private ResponseEntity<Void> doRemoveGroupMember(
            String authorization,
            Long groupId,
            Long userId) {
        AccessDecision auth = requireRole(authorization, "teacher", false);
        if (auth.isDenied()) {
            return auth.deniedResponse();
        }
        try {
            groupManagementService.removeMember(groupId, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            if ("group not found".equals(ex.getMessage()) || "user not found".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            if ("user is not in this group".equals(ex.getMessage())) {
                return ResponseEntity.badRequest().build();
            }
            throw ex;
        }
    }
}
