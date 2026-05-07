package com.example.auth.repository;

import com.example.auth.entity.TestGroupLink;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Репозиторий связей тестов и учебных групп.
 */
public interface TestGroupLinkRepository extends JpaRepository<TestGroupLink, Long> {

    /**
     * Считает количество тестов, связанных с группой.
     */
    long countByGroupId(Long groupId);
}
