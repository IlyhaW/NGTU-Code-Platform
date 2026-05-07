package com.example.auth.repository;

import com.example.auth.entity.GroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Репозиторий для работы с учебными группами.
 */
public interface GroupRepository extends JpaRepository<GroupEntity, Long> {

    /**
     * Проверяет наличие группы с указанным именем.
     */
    boolean existsByName(String name);
}

