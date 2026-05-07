package com.example.auth.service;

import com.example.auth.dto.CreateGroupRequest;
import com.example.auth.dto.GroupMemberDto;
import com.example.auth.dto.GroupSummaryDto;
import com.example.auth.entity.GroupEntity;
import com.example.auth.entity.User;
import com.example.auth.repository.GroupRepository;
import com.example.auth.repository.TestGroupLinkRepository;
import com.example.auth.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
/**
 * Сервис управления учебными группами и их участниками.
 */
public class GroupManagementService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final TestGroupLinkRepository testGroupLinkRepository;

    /**
     * Создает сервис управления группами и внедряет зависимости.
     */
    public GroupManagementService(
            GroupRepository groupRepository,
            UserRepository userRepository,
            TestGroupLinkRepository testGroupLinkRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.testGroupLinkRepository = testGroupLinkRepository;
    }

    /** Возвращает список групп с количеством участников. */
    @Transactional(readOnly = true)
    public List<GroupSummaryDto> listSummaries() {
        return groupRepository.findAll(Sort.by("name")).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    /** Преобразует сущность группы в краткое DTO-представление. */
    private GroupSummaryDto toSummary(GroupEntity g) {
        GroupSummaryDto d = new GroupSummaryDto();
        d.setId(g.getId());
        d.setName(g.getName());
        d.setMemberCount(userRepository.countByGroup_Id(g.getId()));
        return d;
    }

    /** Возвращает список участников указанной группы. */
    @Transactional(readOnly = true)
    public List<GroupMemberDto> listMembers(Long groupId) {
        groupRepository.findById(groupId).orElseThrow(() -> new IllegalArgumentException("group not found"));
        return userRepository.findByGroup_IdOrderByFullNameAsc(groupId).stream()
                .map(this::toMember)
                .collect(Collectors.toList());
    }

    /** Преобразует сущность пользователя в DTO участника группы. */
    private GroupMemberDto toMember(User u) {
        GroupMemberDto m = new GroupMemberDto();
        m.setId(u.getId());
        m.setFullName(u.getFullName());
        m.setLogin(u.getLogin());
        m.setRole(u.getRole());
        return m;
    }

    /** Создает новую группу после валидации имени и уникальности. */
    @Transactional
    public GroupSummaryDto create(CreateGroupRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        String name = request.getName().trim();
        if (name.length() > 255) {
            throw new IllegalArgumentException("name is too long");
        }
        if (groupRepository.existsByName(name)) {
            throw new IllegalStateException("группа с таким названием уже есть");
        }
        GroupEntity g = new GroupEntity();
        g.setName(name);
        GroupEntity saved = groupRepository.save(g);
        return toSummary(saved);
    }

    /** Удаляет группу, если в ней нет участников и привязанных тестов. */
    @Transactional
    public void delete(Long groupId) {
        GroupEntity g = groupRepository.findById(groupId).orElseThrow(() -> new IllegalArgumentException("group not found"));
        if (userRepository.countByGroup_Id(groupId) > 0) {
            throw new IllegalStateException("нельзя удалить группу с участниками: сначала переведите их в другую группу");
        }
        if (testGroupLinkRepository.countByGroupId(groupId) > 0) {
            throw new IllegalStateException("группа используется в тестах");
        }
        groupRepository.delete(g);
    }

    /** Исключает пользователя из группы, обнуляя его group_id. */
    @Transactional
    public void removeMember(Long groupId, Long userId) {
        groupRepository.findById(groupId).orElseThrow(() -> new IllegalArgumentException("group not found"));
        User u = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("user not found"));
        if (u.getGroup() == null || !u.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("user is not in this group");
        }
        u.setGroup(null);
        userRepository.save(u);
    }
}
