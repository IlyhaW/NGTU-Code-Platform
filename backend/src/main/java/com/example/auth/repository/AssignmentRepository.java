package com.example.auth.repository;

import com.example.auth.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Репозиторий для работы с темами.
 */
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    /**
     * Возвращает все темы в порядке убывания даты создания.
     */
    List<Assignment> findAllByOrderByCreatedAtDesc();

    /**
     * Возвращает темы указанного преподавателя в порядке убывания даты создания.
     */
    List<Assignment> findAllByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    /**
     * Проверяет принадлежность темы преподавателю.
     */
    boolean existsByIdAndTeacherId(Long id, Long teacherId);
}
