package com.example.auth.repository;

import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Репозиторий пользователей платформы.
 */
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * Находит пользователя по логину.
     */
    Optional<User> findByLogin(String login);

    /**
     * Проверяет уникальность логина.
     */
    boolean existsByLogin(String login);

    /**
     * Считает число пользователей в группе.
     */
    long countByGroup_Id(Long groupId);

    /**
     * Возвращает пользователей группы в алфавитном порядке.
     */
    List<User> findByGroup_IdOrderByFullNameAsc(Long groupId);

    /**
     * Возвращает студентов выбранных групп.
     */
    @Query(
            "SELECT u FROM User u WHERE u.group IS NOT NULL AND u.group.id IN :groupIds "
                    + "AND LOWER(u.role) = 'student' ORDER BY u.fullName ASC")
    List<User> findStudentsByGroupIds(@Param("groupIds") Collection<Long> groupIds);

    /**
     * Считает уникальных студентов в выбранных группах.
     */
    @Query(
            "SELECT COUNT(DISTINCT u.id) FROM User u WHERE u.group IS NOT NULL AND u.group.id IN :groupIds "
                    + "AND LOWER(u.role) = 'student'")
    long countDistinctStudentsInGroups(@Param("groupIds") Collection<Long> groupIds);

    /**
     * Возвращает идентификаторы студентов в стабильном порядке по id.
     */
    @Query(
            "SELECT u.id FROM User u WHERE u.group IS NOT NULL AND u.group.id IN :groupIds "
                    + "AND LOWER(u.role) = 'student' ORDER BY u.id ASC")
    List<Long> findDistinctStudentIdsByGroupIdsOrderById(@Param("groupIds") Collection<Long> groupIds);
}

