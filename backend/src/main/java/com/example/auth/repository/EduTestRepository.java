package com.example.auth.repository;

import com.example.auth.entity.EduTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с сущностью теста.
 */
public interface EduTestRepository extends JpaRepository<EduTest, Long> {

    /**
     * Возвращает тесты преподавателя по дате обновления.
     */
    List<EduTest> findByTeacherIdOrderByUpdatedAtDesc(Long teacherId);

    /**
     * Находит тест преподавателя по идентификатору.
     */
    Optional<EduTest> findByIdAndTeacherId(Long id, Long teacherId);

    /**
     * Возвращает активные тесты группы в текущем временном интервале.
     */
    @Query(
            "SELECT t FROM EduTest t JOIN t.groupLinks gl WHERE gl.groupId = :groupId "
                    + "AND t.status = 'active' AND t.startDate <= :now AND t.endDate >= :now "
                    + "ORDER BY t.startDate DESC")
    List<EduTest> findCurrentForGroup(@Param("groupId") Long groupId, @Param("now") LocalDateTime now);

    /**
     * Возвращает будущие активные тесты группы, отсортированные по старту.
     */
    @Query(
            "SELECT t FROM EduTest t JOIN t.groupLinks gl WHERE gl.groupId = :groupId "
                    + "AND t.status = 'active' AND t.startDate > :now "
                    + "ORDER BY t.startDate ASC")
    List<EduTest> findUpcomingForGroup(@Param("groupId") Long groupId, @Param("now") LocalDateTime now);
}
