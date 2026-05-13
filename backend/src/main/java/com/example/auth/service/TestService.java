package com.example.auth.service;

import com.example.auth.dto.CreateTestQuestionItem;
import com.example.auth.dto.CreateTestRequest;
import com.example.auth.dto.TestCreatedDto;
import com.example.auth.dto.TestDetailDto;
import com.example.auth.dto.TestDetailGroupDto;
import com.example.auth.dto.TestDetailQuestionDto;
import com.example.auth.dto.StudentCompletedQuestionReviewDto;
import com.example.auth.dto.StudentCompletedTestReviewDto;
import com.example.auth.dto.StudentTestAnswerItemDto;
import com.example.auth.dto.StudentTestDetailDto;
import com.example.auth.dto.StudentTestListItemDto;
import com.example.auth.dto.StudentTestQuestionDto;
import com.example.auth.dto.StudentVisibleTestCaseDto;
import com.example.auth.dto.StudentTestSubmissionRowDto;
import com.example.auth.dto.TestAnswerCheckCaseDto;
import com.example.auth.dto.TestAnswerCheckDto;
import com.example.auth.dto.TestAnalyticsAttemptBinDto;
import com.example.auth.dto.TestAnalyticsDayDto;
import com.example.auth.dto.TestAnalyticsDto;
import com.example.auth.dto.TestAnalyticsGroupDto;
import com.example.auth.dto.TestAnalyticsQuestionDto;
import com.example.auth.dto.TestAnalyticsQuestionColumnDto;
import com.example.auth.dto.TestAnalyticsStatusSliceDto;
import com.example.auth.dto.TestAnalyticsStudentCellDto;
import com.example.auth.dto.TestAnalyticsStudentRowDto;
import com.example.auth.dto.TestListItemDto;
import com.example.auth.dto.TestSubmissionsDto;
import com.example.auth.entity.Assignment;
import com.example.auth.entity.AssignmentTask;
import com.example.auth.entity.AssignmentVariant;
import com.example.auth.entity.EduTest;
import com.example.auth.entity.StudentTestCompletion;
import com.example.auth.entity.GroupEntity;
import com.example.auth.entity.TaskTestCase;
import com.example.auth.entity.TestGroupLink;
import com.example.auth.entity.TestQuestion;
import com.example.auth.entity.TestQuestionAnswer;
import com.example.auth.entity.User;
import com.example.auth.repository.AssignmentRepository;
import com.example.auth.repository.AssignmentTaskRepository;
import com.example.auth.repository.AssignmentVariantRepository;
import com.example.auth.repository.EduTestRepository;
import com.example.auth.repository.GroupRepository;
import com.example.auth.repository.StudentTestCompletionRepository;
import com.example.auth.repository.TaskTestCaseRepository;
import com.example.auth.repository.TestQuestionAnswerRepository;
import com.example.auth.repository.TestQuestionRepository;
import com.example.auth.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
/**
 * Сервис создания, прохождения и аналитики тестов.
 */
public class TestService {

    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules();
    private static final int MAX_ANSWER_CHARS = 512_000;

    private static final String STATUS_SAVED = "saved";
    private static final String STATUS_AWAITING_REVIEW = "awaiting_review";
    private static final String STATUS_NONE = "none";
    private static final String STATUS_GRADED_PASS = "graded_pass";
    private static final String STATUS_GRADED_FAIL = "graded_fail";

    @PersistenceContext
    private EntityManager entityManager;

    private final EduTestRepository eduTestRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentTaskRepository assignmentTaskRepository;
    private final AssignmentVariantRepository assignmentVariantRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestQuestionAnswerRepository testQuestionAnswerRepository;
    private final StudentTestCompletionRepository studentTestCompletionRepository;
    private final TaskTestCaseRepository taskTestCaseRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final PythonJudgeService pythonJudgeService;

    /**
     * Создает сервис тестов и внедряет все зависимости.
     */
    public TestService(
            EduTestRepository eduTestRepository,
            AssignmentRepository assignmentRepository,
            AssignmentTaskRepository assignmentTaskRepository,
            AssignmentVariantRepository assignmentVariantRepository,
            TestQuestionRepository testQuestionRepository,
            TestQuestionAnswerRepository testQuestionAnswerRepository,
            StudentTestCompletionRepository studentTestCompletionRepository,
            TaskTestCaseRepository taskTestCaseRepository,
            GroupRepository groupRepository,
            UserRepository userRepository,
            PythonJudgeService pythonJudgeService) {
        this.eduTestRepository = eduTestRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentTaskRepository = assignmentTaskRepository;
        this.assignmentVariantRepository = assignmentVariantRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testQuestionAnswerRepository = testQuestionAnswerRepository;
        this.studentTestCompletionRepository = studentTestCompletionRepository;
        this.taskTestCaseRepository = taskTestCaseRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.pythonJudgeService = pythonJudgeService;
    }

    /** Возвращает текущие тесты студента в активном временном интервале. */
    @Transactional(readOnly = true)
    public List<StudentTestListItemDto> listCurrentTestsForStudent(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getGroup() == null) {
            return List.of();
        }
        Long groupId = user.getGroup().getId();
        LocalDateTime now = LocalDateTime.now();
        List<EduTest> tests = eduTestRepository.findCurrentForGroup(groupId, now);
        List<StudentTestListItemDto> out = new ArrayList<>();
        for (EduTest t : tests) {
            if (studentTestCompletionRepository.existsByUserIdAndTestId(userId, t.getId())) {
                continue;
            }
            out.add(toStudentListItem(t));
        }
        return out;
    }

    /** Возвращает запланированные тесты студента без раскрытия заданий. */
    @Transactional(readOnly = true)
    public List<StudentTestListItemDto> listUpcomingTestsForStudent(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getGroup() == null) {
            return List.of();
        }
        Long groupId = user.getGroup().getId();
        LocalDateTime now = LocalDateTime.now();
        List<EduTest> tests = eduTestRepository.findUpcomingForGroup(groupId, now);
        List<StudentTestListItemDto> out = new ArrayList<>();
        for (EduTest t : tests) {
            StudentTestListItemDto dto = toStudentListItem(t);
            dto.setTopicsSummary(null);
            out.add(dto);
        }
        return out;
    }

    /** Возвращает завершенные тесты студента в порядке от новых к старым. */
    @Transactional(readOnly = true)
    public List<StudentTestListItemDto> listCompletedTestsForStudent(Long userId) {
        userRepository.findById(userId).orElseThrow();
        List<StudentTestCompletion> rows =
                studentTestCompletionRepository.findByUserIdWithTestOrderByCompletedAtDesc(userId);
        List<StudentTestListItemDto> out = new ArrayList<>();
        for (StudentTestCompletion c : rows) {
            StudentTestListItemDto dto = toStudentListItem(c.getTest());
            dto.setCompletedAt(c.getCompletedAt());
            dto.setTotalTimeSeconds(c.getTotalTimeSeconds());
            out.add(dto);
        }
        return out;
    }

    /** Возвращает полный обзор завершенного теста студента. */
    @Transactional(readOnly = true)
    public Optional<StudentCompletedTestReviewDto> getCompletedTestReviewForStudent(Long userId, Long testId) {
        Optional<StudentTestCompletion> completionOpt =
                studentTestCompletionRepository.findByUserIdAndTestId(userId, testId);
        if (completionOpt.isEmpty()) {
            return Optional.empty();
        }
        StudentTestCompletion completion = completionOpt.get();
        EduTest test = eduTestRepository.findById(testId).orElse(null);
        if (test == null) {
            return Optional.empty();
        }

        List<TestQuestion> ordered =
                test.getQuestions().stream()
                        .sorted(Comparator.comparingInt(TestQuestion::getSortOrder))
                        .collect(Collectors.toList());

        Map<Long, TestQuestionAnswer> byQid = new HashMap<>();
        for (TestQuestionAnswer a :
                testQuestionAnswerRepository.findByStudentUserIdAndTestQuestion_Test_Id(userId, testId)) {
            byQid.put(a.getTestQuestion().getId(), a);
        }

        Set<Long> assignmentIds =
                ordered.stream().map(TestQuestion::getAssignmentId).collect(Collectors.toSet());
        Map<Long, Assignment> assignmentMap =
                assignmentRepository.findAllById(assignmentIds).stream()
                        .collect(Collectors.toMap(Assignment::getId, a -> a));

        Set<Long> taskIds =
                ordered.stream()
                        .map(TestQuestion::getAssignmentTaskId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
        Map<Long, AssignmentTask> taskMap =
                assignmentTaskRepository.findAllById(taskIds).stream()
                        .collect(Collectors.toMap(AssignmentTask::getId, x -> x));

        StudentCompletedTestReviewDto dto = new StudentCompletedTestReviewDto();
        dto.setTestId(test.getId());
        dto.setTestName(test.getName());
        dto.setCompletedAt(completion.getCompletedAt());
        dto.setTotalTimeSeconds(completion.getTotalTimeSeconds());

        int studentIndexInTest = studentIndexForTest(test, userId);

        for (TestQuestion q : ordered) {
            StudentCompletedQuestionReviewDto qd = new StudentCompletedQuestionReviewDto();
            qd.setTestQuestionId(q.getId());
            qd.setSortOrder(q.getSortOrder());
            qd.setMaxAttempts(q.getMaxAttempts());
            Assignment a = assignmentMap.get(q.getAssignmentId());
            qd.setAssignmentName(a != null ? a.getName() : "Тема #" + q.getAssignmentId());
            if (q.getAssignmentTaskId() != null) {
                AssignmentTask task = taskMap.get(q.getAssignmentTaskId());
                qd.setTaskName(task != null ? task.getTitle() : "Задача #" + q.getAssignmentTaskId());
                List<AssignmentVariant> variants =
                        assignmentVariantRepository.findByTaskIdOrderByIdAsc(q.getAssignmentTaskId());
                qd.setTaskContent(
                        taskTextForStudent(task, variants, q.isIndividualVariants(), studentIndexInTest));
            } else {
                qd.setTaskName("—");
                qd.setTaskContent("");
            }
            TestQuestionAnswer ans = byQid.get(q.getId());
            if (ans != null) {
                qd.setSolutionContent(ans.getContent());
                qd.setAttemptsUsed(ans.getAttemptsUsed());
                qd.setTimeSpentSeconds(ans.getTimeSpentSeconds());
                qd.setSolutionStatus(ans.getSolutionStatus());
                qd.setStatusLabel(statusLabelRu(ans.getSolutionStatus()));
            } else {
                qd.setSolutionContent("");
                qd.setAttemptsUsed(0);
                qd.setTimeSpentSeconds(null);
                qd.setSolutionStatus(STATUS_NONE);
                qd.setStatusLabel(statusLabelRu(STATUS_NONE));
            }
            dto.getQuestions().add(qd);
        }
        return Optional.of(dto);
    }

    /** Помечает тест как завершенный для студента. */
    @Transactional
    public boolean completeTestForStudent(Long userId, Long testId, Integer totalTimeSeconds) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getGroup() == null) {
            return false;
        }
        Long groupId = user.getGroup().getId();
        LocalDateTime now = LocalDateTime.now();
        EduTest test = eduTestRepository.findById(testId).orElse(null);
        if (test == null) {
            return false;
        }
        boolean inGroup =
                test.getGroupLinks().stream().anyMatch(l -> l.getGroupId().equals(groupId));
        if (!inGroup || !"active".equals(test.getStatus())) {
            return false;
        }
        if (test.getStartDate().isAfter(now) || test.getEndDate().isBefore(now)) {
            return false;
        }
        if (studentTestCompletionRepository.existsByUserIdAndTestId(userId, testId)) {
            return true;
        }
        StudentTestCompletion row = new StudentTestCompletion();
        row.setUserId(userId);
        row.setTest(test);
        if (totalTimeSeconds != null && totalTimeSeconds >= 0) {
            row.setTotalTimeSeconds(totalTimeSeconds);
        }
        studentTestCompletionRepository.save(row);
        markAnswersAwaitingReview(userId, testId);
        return true;
    }

    /** Переводит все ответы студента по тесту в статус ожидания проверки. */
    private void markAnswersAwaitingReview(Long userId, Long testId) {
        List<TestQuestionAnswer> list =
                testQuestionAnswerRepository.findByStudentUserIdAndTestQuestion_Test_Id(userId, testId);
        for (TestQuestionAnswer a : list) {
            a.setSolutionStatus(STATUS_AWAITING_REVIEW);
            testQuestionAnswerRepository.save(a);
        }
    }

    /** Возвращает русское отображаемое имя статуса ответа. */
    private static String statusLabelRu(String status) {
        if (status == null || STATUS_NONE.equals(status)) {
            return "Нет ответа";
        }
        switch (status) {
            case STATUS_SAVED:
                return "Сохранено";
            case STATUS_AWAITING_REVIEW:
                return "На проверке у преподавателя";
            case STATUS_GRADED_PASS:
                return "Зачёт";
            case STATUS_GRADED_FAIL:
                return "Не зачёт";
            default:
                return status;
        }
    }

    /** Преобразует тест в краткое DTO для списков студента. */
    private StudentTestListItemDto toStudentListItem(EduTest t) {
        List<TestQuestion> questions =
                t.getQuestions().stream()
                        .sorted(Comparator.comparingInt(TestQuestion::getSortOrder))
                        .collect(Collectors.toList());
        Set<Long> assignmentIds =
                questions.stream()
                        .map(TestQuestion::getAssignmentId)
                        .collect(Collectors.toCollection(LinkedHashSet::new));
        Map<Long, Assignment> assignmentMap =
                assignmentRepository.findAllById(assignmentIds).stream()
                        .collect(Collectors.toMap(Assignment::getId, a -> a));

        LinkedHashSet<String> topicNames = new LinkedHashSet<>();
        LinkedHashSet<String> tagSet = new LinkedHashSet<>();
        for (TestQuestion q : questions) {
            Assignment a = assignmentMap.get(q.getAssignmentId());
            if (a != null) {
                topicNames.add(a.getName());
                if (a.getTags() != null && !a.getTags().isBlank()) {
                    for (String tag : splitAssignmentTags(a.getTags())) {
                        tagSet.add(tag);
                    }
                }
            }
        }

        StudentTestListItemDto dto = new StudentTestListItemDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setStartDate(t.getStartDate());
        dto.setEndDate(t.getEndDate());
        dto.setTopicsSummary(String.join(", ", topicNames));
        dto.setTags(new ArrayList<>(tagSet));
        return dto;
    }

    /** Разбирает строку тегов темы в список. */
    private static List<String> splitAssignmentTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** Возвращает список тестов преподавателя. */
    @Transactional(readOnly = true)
    public List<TestListItemDto> listForTeacher(Long teacherId) {
        return eduTestRepository.findByTeacherIdOrderByUpdatedAtDesc(teacherId).stream()
                .map(this::toListItem)
                .collect(Collectors.toList());
    }

    /** Возвращает детальные данные теста преподавателя. */
    @Transactional(readOnly = true)
    public Optional<TestDetailDto> getDetail(Long teacherId, Long testId) {
        return eduTestRepository.findByIdAndTeacherId(testId, teacherId).map(this::toDetailDto);
    }

    /** Возвращает детальный тест для прохождения студентом. */
    @Transactional(readOnly = true)
    public Optional<StudentTestDetailDto> getDetailForStudent(Long userId, Long testId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getGroup() == null) {
            return Optional.empty();
        }
        Long groupId = user.getGroup().getId();
        LocalDateTime now = LocalDateTime.now();
        EduTest test = eduTestRepository.findById(testId).orElse(null);
        if (test == null) {
            return Optional.empty();
        }
        boolean inGroup =
                test.getGroupLinks().stream().anyMatch(l -> l.getGroupId().equals(groupId));
        if (!inGroup || !"active".equals(test.getStatus())) {
            return Optional.empty();
        }
        if (test.getStartDate().isAfter(now) || test.getEndDate().isBefore(now)) {
            return Optional.empty();
        }
        if (studentTestCompletionRepository.existsByUserIdAndTestId(userId, testId)) {
            return Optional.empty();
        }
        return Optional.of(toStudentDetailDto(test, userId));
    }

    /** Сохраняет или обновляет ответ студента на вопрос теста. */
    @Transactional
    public boolean saveStudentAnswer(
            Long userId, Long testId, Long testQuestionId, String content, Integer timeSpentSeconds) {
        if (testQuestionId == null) {
            throw new IllegalArgumentException("testQuestionId is required");
        }
        String text = content == null ? "" : content;
        if (text.length() > MAX_ANSWER_CHARS) {
            throw new IllegalArgumentException("content too long");
        }
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getGroup() == null) {
            return false;
        }
        Long groupId = user.getGroup().getId();
        LocalDateTime now = LocalDateTime.now();
        EduTest test = eduTestRepository.findById(testId).orElse(null);
        if (test == null) {
            return false;
        }
        boolean inGroup =
                test.getGroupLinks().stream().anyMatch(l -> l.getGroupId().equals(groupId));
        if (!inGroup || !"active".equals(test.getStatus())) {
            return false;
        }
        if (test.getStartDate().isAfter(now) || test.getEndDate().isBefore(now)) {
            return false;
        }
        if (studentTestCompletionRepository.existsByUserIdAndTestId(userId, testId)) {
            return false;
        }
        TestQuestion tq = testQuestionRepository.findByIdAndTest_Id(testQuestionId, testId).orElse(null);
        if (tq == null) {
            return false;
        }
        int maxAttempts = tq.getMaxAttempts() > 0 ? tq.getMaxAttempts() : Integer.MAX_VALUE;
        Optional<TestQuestionAnswer> existing =
                testQuestionAnswerRepository.findByTestQuestion_IdAndStudentUserId(testQuestionId, userId);
        if (existing.isPresent()) {
            TestQuestionAnswer row = existing.get();
            int used = row.getAttemptsUsed();
            if (used >= maxAttempts) {
                throw new IllegalArgumentException("max attempts exceeded");
            }
            row.setContent(text);
            row.setAttemptsUsed(used + 1);
            if (timeSpentSeconds != null && timeSpentSeconds >= 0) {
                row.setTimeSpentSeconds(timeSpentSeconds);
            }
            testQuestionAnswerRepository.save(row);
        } else {
            if (maxAttempts <= 0) {
                throw new IllegalArgumentException("max attempts exceeded");
            }
            TestQuestionAnswer row = new TestQuestionAnswer();
            row.setTestQuestion(tq);
            row.setStudentUserId(userId);
            row.setContent(text);
            row.setAttemptsUsed(1);
            row.setSolutionStatus(STATUS_SAVED);
            if (timeSpentSeconds != null && timeSpentSeconds >= 0) {
                row.setTimeSpentSeconds(timeSpentSeconds);
            }
            testQuestionAnswerRepository.save(row);
        }
        return true;
    }

    /** Выполняет автоматическую проверку ответа студента по тест-кейсам. */
    @Transactional
    public Optional<TestAnswerCheckDto> checkStudentAnswer(Long userId, Long testId, Long testQuestionId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getGroup() == null) {
            return Optional.empty();
        }
        Long groupId = user.getGroup().getId();
        LocalDateTime now = LocalDateTime.now();
        EduTest test = eduTestRepository.findById(testId).orElse(null);
        if (test == null) {
            return Optional.empty();
        }
        boolean inGroup = test.getGroupLinks().stream().anyMatch(l -> l.getGroupId().equals(groupId));
        if (!inGroup || !"active".equals(test.getStatus())) {
            return Optional.empty();
        }
        if (test.getStartDate().isAfter(now) || test.getEndDate().isBefore(now)) {
            return Optional.empty();
        }
        if (studentTestCompletionRepository.existsByUserIdAndTestId(userId, testId)) {
            return Optional.empty();
        }
        TestQuestion tq = testQuestionRepository.findByIdAndTest_Id(testQuestionId, testId).orElse(null);
        if (tq == null || tq.getAssignmentTaskId() == null) {
            return Optional.empty();
        }
        AssignmentTask task = assignmentTaskRepository.findById(tq.getAssignmentTaskId()).orElse(null);
        List<AssignmentVariant> variants =
                assignmentVariantRepository.findByTaskIdOrderByIdAsc(tq.getAssignmentTaskId());
        int studentIndexInTest = studentIndexForTest(test, userId);
        AssignmentVariant selectedVariant =
                pickVariantForStudent(variants, tq.isIndividualVariants(), studentIndexInTest);
        TestQuestionAnswer answerRow = testQuestionAnswerRepository
                .findByTestQuestion_IdAndStudentUserId(testQuestionId, userId)
                .orElse(null);
        String code = answerRow != null ? answerRow.getContent() : "";
        List<TaskTestCase> cases = List.of();
        if (selectedVariant != null && selectedVariant.getId() != null) {
            cases = taskTestCaseRepository.findByTaskIdAndVariantIdAndActiveTrueOrderByIdAsc(
                    tq.getAssignmentTaskId(), selectedVariant.getId());
        }
        if (cases.isEmpty()) {
            cases = taskTestCaseRepository.findByTaskIdAndVariantIdIsNullAndActiveTrueOrderByIdAsc(tq.getAssignmentTaskId());
        }
        if (cases.isEmpty()) {
            cases = taskTestCaseRepository.findByTaskIdAndActiveTrueOrderByIdAsc(tq.getAssignmentTaskId());
        }
        if (cases.isEmpty()) {
            return Optional.of(new TestAnswerCheckDto(
                    testId,
                    testQuestionId,
                    "python",
                    "NO_TESTS",
                    0,
                    0,
                    0,
                    0,
                    "Для этой задачи пока не настроены тест-кейсы.",
                    List.of()));
        }

        int passed = 0;
        long maxTime = 0;
        long maxMemory = 0;
        List<TestAnswerCheckCaseDto> rows = new ArrayList<>();
        String firstFailVerdict = null;
        for (TaskTestCase tc : cases) {
            long timeLimit =
                    task != null && task.getJudgeTimeLimitMs() != null && task.getJudgeTimeLimitMs() > 0
                            ? task.getJudgeTimeLimitMs()
                            : (tc.getTimeLimitMs() != null && tc.getTimeLimitMs() > 0 ? tc.getTimeLimitMs() : 2000);
            long memLimit =
                    task != null && task.getJudgeMemoryLimitKb() != null && task.getJudgeMemoryLimitKb() > 0
                            ? task.getJudgeMemoryLimitKb()
                            : (tc.getMemoryLimitKb() != null && tc.getMemoryLimitKb() > 0 ? tc.getMemoryLimitKb() : 262144);
            PythonJudgeService.PythonRunResult run = pythonJudgeService.run(code, tc.getInputData(), timeLimit, memLimit);
            maxTime = Math.max(maxTime, run.elapsedMs());
            maxMemory = Math.max(maxMemory, run.memoryKb());
            if (!run.ok()) {
                String caseVerdict = extractRunVerdict(run.error());
                if (firstFailVerdict == null) {
                    firstFailVerdict = caseVerdict;
                }
                rows.add(new TestAnswerCheckCaseDto(
                        tc.getId(),
                        false,
                        caseVerdict,
                        run.elapsedMs(),
                        run.memoryKb(),
                        normalizeRunErrorMessage(run.error())));
                continue;
            }
            boolean ok = normalizeOutput(run.stdout()).equals(normalizeOutput(tc.getExpectedOutput()));
            if (ok) {
                passed++;
            } else if (firstFailVerdict == null) {
                firstFailVerdict = "WA";
            }
            String caseMessage;
            if (ok) {
                caseMessage = "Тест пройден";
            } else if (tc.isPublic()) {
                String expected = normalizeOutput(tc.getExpectedOutput());
                String actual = normalizeOutput(run.stdout());
                caseMessage = "Неверный ответ. Ожидалось: [" + shorten(expected) + "], получено: [" + shorten(actual) + "]";
            } else {
                caseMessage = "Неверный ответ на закрытом тесте";
            }
            rows.add(new TestAnswerCheckCaseDto(
                    tc.getId(),
                    ok,
                    ok ? "OK" : "WA",
                    run.elapsedMs(),
                    run.memoryKb(),
                    caseMessage));
        }
        String verdict = passed == rows.size() ? "AC" : (firstFailVerdict != null ? firstFailVerdict : "FAILED");
        String message = passed == rows.size()
                ? "Все тесты пройдены."
                : verdictMessage(verdict, passed, rows.size());
        if (answerRow != null) {
            answerRow.setSolutionStatus("AC".equals(verdict) ? STATUS_GRADED_PASS : STATUS_GRADED_FAIL);
            testQuestionAnswerRepository.save(answerRow);
        }
        return Optional.of(new TestAnswerCheckDto(
                testId,
                testQuestionId,
                "python",
                verdict,
                passed,
                rows.size(),
                maxTime,
                maxMemory,
                message,
                rows));
    }

    /** Извлекает код вердикта из текстовой ошибки runner-а. */
    private static String extractRunVerdict(String error) {
        String e = error == null ? "" : error.trim();
        if (e.startsWith("CE:")) return "CE";
        if (e.startsWith("TLE:") || "TLE".equals(e)) return "TLE";
        if (e.startsWith("MLE:") || "MLE".equals(e)) return "MLE";
        if (e.startsWith("RE:")) return "RE";
        return "RE";
    }

    /** Нормализует сообщение об ошибке выполнения для UI. */
    private static String normalizeRunErrorMessage(String error) {
        if (error == null || error.isBlank()) {
            return "Ошибка выполнения";
        }
        String e = error.trim();
        if ("TLE".equals(e)) return "Превышено ограничение времени";
        if ("MLE".equals(e)) return "Превышено ограничение памяти";
        if (e.startsWith("CE:")) return "Ошибка компиляции/синтаксиса: " + shortRuntimeError(e.substring(3));
        if (e.startsWith("RE:")) return "Ошибка выполнения: " + shortRuntimeError(e.substring(3));
        return e;
    }

    /** Формирует человекочитаемое сообщение по итоговому вердикту. */
    private static String verdictMessage(String verdict, int passed, int total) {
        return switch (verdict) {
            case "CE" -> "Ошибка компиляции (синтаксиса). Пройдено " + passed + " из " + total + " тестов.";
            case "TLE" -> "Превышено ограничение времени. Пройдено " + passed + " из " + total + " тестов.";
            case "MLE" -> "Превышено ограничение памяти. Пройдено " + passed + " из " + total + " тестов.";
            case "RE" -> "Ошибка выполнения программы. Пройдено " + passed + " из " + total + " тестов.";
            case "WA" -> "Неверный ответ. Пройдено " + passed + " из " + total + " тестов.";
            default -> "Пройдено " + passed + " из " + total + " тестов.";
        };
    }

    /** Обрезает длинную строку для вывода в сообщение. */
    private static String shorten(String s) {
        if (s == null) return "";
        String oneLine = s.replace("\n", "\\n");
        return oneLine.length() > 180 ? oneLine.substring(0, 180) + "..." : oneLine;
    }

    /** Выделяет краткую причину runtime-ошибки из traceback. */
    private static String shortRuntimeError(String raw) {
        if (raw == null || raw.isBlank()) {
            return "неизвестная причина";
        }
        String[] lines = raw.replace("\r", "").split("\n");
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            if (line.startsWith("File \"")) continue;
            if ("Traceback (most recent call last):".equals(line)) continue;
            return shorten(line);
        }
        return shorten(raw.trim());
    }

    /** Возвращает ответы студентов по тесту для преподавателя-владельца. */
    @Transactional(readOnly = true)
    public Optional<TestSubmissionsDto> getSubmissionsForTeacher(Long teacherId, Long testId) {
        Optional<EduTest> opt = eduTestRepository.findByIdAndTeacherId(testId, teacherId);
        if (opt.isEmpty()) {
            return Optional.empty();
        }
        EduTest test = opt.get();
        List<TestQuestion> ordered =
                test.getQuestions().stream()
                        .sorted(Comparator.comparingInt(TestQuestion::getSortOrder))
                        .collect(Collectors.toList());

        Set<Long> assignmentIds =
                ordered.stream().map(TestQuestion::getAssignmentId).collect(Collectors.toSet());
        Map<Long, Assignment> assignmentMap =
                assignmentRepository.findAllById(assignmentIds).stream()
                        .collect(Collectors.toMap(Assignment::getId, a -> a));

        Set<Long> taskIds =
                ordered.stream()
                        .map(TestQuestion::getAssignmentTaskId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
        Map<Long, AssignmentTask> taskMap =
                assignmentTaskRepository.findAllById(taskIds).stream()
                        .collect(Collectors.toMap(AssignmentTask::getId, x -> x));

        Set<Long> groupIds =
                test.getGroupLinks().stream().map(TestGroupLink::getGroupId).collect(Collectors.toSet());
        List<User> students =
                groupIds.isEmpty() ? List.of() : userRepository.findStudentsByGroupIds(groupIds);

        List<TestQuestionAnswer> allAnswers = testQuestionAnswerRepository.findByTestQuestion_Test_Id(testId);
        Map<Long, Map<Long, TestQuestionAnswer>> byStudent = new HashMap<>();
        for (TestQuestionAnswer a : allAnswers) {
            byStudent
                    .computeIfAbsent(a.getStudentUserId(), k -> new HashMap<>())
                    .put(a.getTestQuestion().getId(), a);
        }

        Map<Long, List<AssignmentVariant>> variantsByTaskId = new HashMap<>();
        for (Long taskId : taskIds) {
            variantsByTaskId.put(taskId, assignmentVariantRepository.findByTaskIdOrderByIdAsc(taskId));
        }

        TestSubmissionsDto dto = new TestSubmissionsDto();
        dto.setTestId(test.getId());
        dto.setTestName(test.getName());

        for (User u : students) {
            StudentTestSubmissionRowDto row = new StudentTestSubmissionRowDto();
            row.setStudentId(u.getId());
            row.setFullName(u.getFullName());
            Map<Long, TestQuestionAnswer> byQ = byStudent.getOrDefault(u.getId(), Map.of());
            int studentIndexInTest = studentIndexForTest(test, u.getId());
            for (TestQuestion q : ordered) {
                StudentTestAnswerItemDto item = new StudentTestAnswerItemDto();
                item.setTestQuestionId(q.getId());
                item.setSortOrder(q.getSortOrder());
                Assignment a = assignmentMap.get(q.getAssignmentId());
                item.setAssignmentName(a != null ? a.getName() : "Тема #" + q.getAssignmentId());
                if (q.getAssignmentTaskId() != null) {
                    AssignmentTask task = taskMap.get(q.getAssignmentTaskId());
                    item.setTaskName(task != null ? task.getTitle() : "Задача #" + q.getAssignmentTaskId());
                    List<AssignmentVariant> variants = variantsByTaskId.getOrDefault(q.getAssignmentTaskId(), List.of());
                    AssignmentVariant selectedVariant =
                            pickVariantForStudent(variants, q.isIndividualVariants(), studentIndexInTest);
                    String fromVariant = selectedVariant != null ? contentForClient(selectedVariant.getContent()) : "";
                    if (fromVariant != null && !fromVariant.isBlank()) {
                        item.setTaskContent(fromVariant.trim());
                    } else {
                        item.setTaskContent(task != null && task.getTitle() != null ? task.getTitle().trim() : "");
                    }
                } else {
                    item.setTaskName("—");
                    item.setTaskContent("");
                }
                TestQuestionAnswer answer = byQ.get(q.getId());
                item.setContent(answer != null ? answer.getContent() : "");
                item.setAttemptsUsed(answer != null ? answer.getAttemptsUsed() : 0);
                String status = answer != null && answer.getSolutionStatus() != null ? answer.getSolutionStatus() : STATUS_NONE;
                item.setSolutionStatus(status);
                item.setStatusLabel(statusLabelRu(status));
                row.getAnswers().add(item);
            }
            dto.getStudents().add(row);
        }
        return Optional.of(dto);
    }

    /** Возвращает агрегированную аналитику по тесту для преподавателя. */
    @Transactional(readOnly = true)
    public Optional<TestAnalyticsDto> getTestAnalyticsForTeacher(Long teacherId, Long testId) {
        Optional<EduTest> opt = eduTestRepository.findByIdAndTeacherId(testId, teacherId);
        if (opt.isEmpty()) {
            return Optional.empty();
        }
        EduTest test = opt.get();
        List<TestQuestion> ordered =
                test.getQuestions().stream()
                        .sorted(Comparator.comparingInt(TestQuestion::getSortOrder))
                        .collect(Collectors.toList());

        Set<Long> assignmentIds =
                ordered.stream().map(TestQuestion::getAssignmentId).collect(Collectors.toSet());
        Map<Long, Assignment> assignmentMap =
                assignmentRepository.findAllById(assignmentIds).stream()
                        .collect(Collectors.toMap(Assignment::getId, a -> a));

        Set<Long> taskIds =
                ordered.stream()
                        .map(TestQuestion::getAssignmentTaskId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
        Map<Long, AssignmentTask> taskMap =
                assignmentTaskRepository.findAllById(taskIds).stream()
                        .collect(Collectors.toMap(AssignmentTask::getId, x -> x));

        Set<Long> groupIds =
                test.getGroupLinks().stream().map(TestGroupLink::getGroupId).collect(Collectors.toSet());
        Map<Long, GroupEntity> groupEntityMap =
                groupIds.isEmpty()
                        ? Map.of()
                        : groupRepository.findAllById(groupIds).stream()
                                .collect(Collectors.toMap(GroupEntity::getId, g -> g));

        List<User> students =
                groupIds.isEmpty() ? List.of() : userRepository.findStudentsByGroupIds(groupIds);
        int totalStudents = students.size();
        Map<Long, Long> studentToGroupId = new HashMap<>();
        for (User u : students) {
            if (u.getGroup() != null) {
                studentToGroupId.put(u.getId(), u.getGroup().getId());
            }
        }

        Set<Long> completedUserIds =
                studentTestCompletionRepository.findByTest_Id(testId).stream()
                        .map(StudentTestCompletion::getUserId)
                        .collect(Collectors.toSet());

        List<TestQuestionAnswer> allAnswers = testQuestionAnswerRepository.findByTestQuestion_Test_Id(testId);
        int totalAnswerRows = allAnswers.size();

        Set<Long> studentsWithAnyRow = new HashSet<>();
        Set<Long> studentsWithNonEmpty = new HashSet<>();
        Map<String, Long> statusCounts = new HashMap<>();
        Map<String, Long> attemptBins = new LinkedHashMap<>();
        for (int i = 1; i <= 4; i++) {
            attemptBins.put(String.valueOf(i), 0L);
        }
        attemptBins.put("5+", 0L);

        Map<LocalDate, Long> eventsByDay = new TreeMap<>();
        Map<LocalDate, Set<Long>> studentsByDay = new TreeMap<>();

        for (TestQuestionAnswer a : allAnswers) {
            studentsWithAnyRow.add(a.getStudentUserId());
            if (isNonEmptyAnswerContent(a.getContent())) {
                studentsWithNonEmpty.add(a.getStudentUserId());
            }
            String st = a.getSolutionStatus() != null ? a.getSolutionStatus() : "unknown";
            statusCounts.merge(st, 1L, Long::sum);

            int att = Math.max(1, a.getAttemptsUsed());
            String bin = att >= 5 ? "5+" : String.valueOf(att);
            attemptBins.merge(bin, 1L, Long::sum);

            LocalDate d = a.getUpdatedAt() != null ? a.getUpdatedAt().toLocalDate() : LocalDate.now();
            eventsByDay.merge(d, 1L, Long::sum);
            studentsByDay.computeIfAbsent(d, k -> new HashSet<>()).add(a.getStudentUserId());
        }

        Map<Long, List<TestQuestionAnswer>> byQuestionId =
                allAnswers.stream().collect(Collectors.groupingBy(a -> a.getTestQuestion().getId()));

        List<TestAnalyticsQuestionDto> questionRows = new ArrayList<>();
        for (TestQuestion q : ordered) {
            List<TestQuestionAnswer> list = byQuestionId.getOrDefault(q.getId(), List.of());
            int withRecord = list.size();
            int passedCount = (int) list.stream()
                    .filter(x -> STATUS_GRADED_PASS.equals(x.getSolutionStatus()))
                    .count();
            int failedCount = withRecord - passedCount;
            int skippedCount = Math.max(0, totalStudents - withRecord);
            long nonEmpty = list.stream().filter(x -> isNonEmptyAnswerContent(x.getContent())).count();
            double avgAttempts =
                    list.stream().mapToInt(TestQuestionAnswer::getAttemptsUsed).average().orElse(0.0);
            List<Integer> times =
                    list.stream()
                            .map(TestQuestionAnswer::getTimeSpentSeconds)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
            Double avgTime =
                    times.isEmpty()
                            ? null
                            : times.stream().mapToInt(Integer::intValue).average().orElse(0.0);

            Assignment asg = assignmentMap.get(q.getAssignmentId());
            String an = asg != null ? asg.getName() : "Тема #" + q.getAssignmentId();
            String tn;
            if (q.getAssignmentTaskId() != null) {
                AssignmentTask task = taskMap.get(q.getAssignmentTaskId());
                tn = task != null ? task.getTitle() : "Задача #" + q.getAssignmentTaskId();
            } else {
                tn = "—";
            }
            questionRows.add(
                    new TestAnalyticsQuestionDto(
                            q.getId(),
                            q.getSortOrder(),
                            an,
                            tn,
                            passedCount,
                            failedCount,
                            skippedCount,
                            withRecord,
                            (int) nonEmpty,
                            avgAttempts,
                            avgTime));
        }

        List<TestAnalyticsQuestionColumnDto> questionColumns = new ArrayList<>();
        for (TestQuestion q : ordered) {
            Assignment asg = assignmentMap.get(q.getAssignmentId());
            String assignmentName = asg != null ? asg.getName() : "Тема #" + q.getAssignmentId();
            String taskName = "—";
            if (q.getAssignmentTaskId() != null) {
                AssignmentTask task = taskMap.get(q.getAssignmentTaskId());
                taskName = task != null ? task.getTitle() : "Задача #" + q.getAssignmentTaskId();
            }
            questionColumns.add(
                    new TestAnalyticsQuestionColumnDto(
                            q.getId(),
                            q.getSortOrder(),
                            assignmentName,
                            taskName,
                            q.getMaxAttempts(),
                            q.getSolveTimeMinutes()));
        }

        Map<Long, Map<Long, TestQuestionAnswer>> answerByStudentAndQuestion = new HashMap<>();
        for (TestQuestionAnswer answer : allAnswers) {
            answerByStudentAndQuestion
                    .computeIfAbsent(answer.getStudentUserId(), ignored -> new HashMap<>())
                    .put(answer.getTestQuestion().getId(), answer);
        }
        List<TestAnalyticsStudentRowDto> studentRows = new ArrayList<>();
        for (User student : students) {
            Map<Long, TestQuestionAnswer> answers =
                    answerByStudentAndQuestion.getOrDefault(student.getId(), Map.of());
            List<TestAnalyticsStudentCellDto> cells = new ArrayList<>();
            int passed = 0;
            for (TestQuestion q : ordered) {
                TestQuestionAnswer answer = answers.get(q.getId());
                int maxAttempts = q.getMaxAttempts() > 0 ? q.getMaxAttempts() : Integer.MAX_VALUE;
                int attemptsUsed = answer != null ? answer.getAttemptsUsed() : 0;
                boolean attemptsOk = answer != null && attemptsUsed <= maxAttempts;
                boolean onTime =
                        answer != null
                                && answer.getUpdatedAt() != null
                                && !answer.getUpdatedAt().isAfter(test.getEndDate());
                boolean cellPassed =
                        answer != null
                                && STATUS_GRADED_PASS.equals(answer.getSolutionStatus())
                                && onTime
                                && attemptsOk;
                if (cellPassed) {
                    passed++;
                }
                String status = answer != null && answer.getSolutionStatus() != null
                        ? answer.getSolutionStatus()
                        : STATUS_NONE;
                cells.add(
                        new TestAnalyticsStudentCellDto(
                                q.getId(),
                                cellPassed,
                                onTime,
                                attemptsOk,
                                attemptsUsed,
                                maxAttempts == Integer.MAX_VALUE ? 0 : maxAttempts,
                                answer != null ? answer.getTimeSpentSeconds() : null,
                                status,
                                statusLabelRu(status),
                                answer != null ? answer.getUpdatedAt() : null,
                                answer != null ? answer.getContent() : ""));
            }
            String groupName =
                    student.getGroup() != null && student.getGroup().getName() != null
                            ? student.getGroup().getName()
                            : "";
            studentRows.add(
                    new TestAnalyticsStudentRowDto(
                            student.getId(),
                            student.getFullName(),
                            groupName,
                            passed,
                            ordered.size(),
                            passed + "/" + ordered.size(),
                            cells));
        }

        List<TestAnalyticsGroupDto> groupRows = new ArrayList<>();
        for (Long gid : groupIds.stream().sorted().collect(Collectors.toList())) {
            GroupEntity ge = groupEntityMap.get(gid);
            String gname = ge != null ? ge.getName() : "Группа #" + gid;
            List<User> inGroup =
                    students.stream()
                            .filter(u -> u.getGroup() != null && gid.equals(u.getGroup().getId()))
                            .collect(Collectors.toList());
            int sc = inGroup.size();
            long comp = inGroup.stream().filter(u -> completedUserIds.contains(u.getId())).count();
            Set<Long> active = new HashSet<>();
            for (TestQuestionAnswer a : allAnswers) {
                if (!isNonEmptyAnswerContent(a.getContent())) {
                    continue;
                }
                Long g = studentToGroupId.get(a.getStudentUserId());
                if (gid.equals(g)) {
                    active.add(a.getStudentUserId());
                }
            }
            groupRows.add(
                    new TestAnalyticsGroupDto(gid, gname, sc, (int) comp, active.size()));
        }

        List<TestAnalyticsStatusSliceDto> statusSlices =
                statusCounts.entrySet().stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .map(e -> new TestAnalyticsStatusSliceDto(e.getKey(), e.getValue()))
                        .collect(Collectors.toList());

        List<TestAnalyticsAttemptBinDto> attemptRows =
                attemptBins.entrySet().stream()
                        .map(e -> new TestAnalyticsAttemptBinDto(e.getKey(), e.getValue()))
                        .collect(Collectors.toList());

        List<TestAnalyticsDayDto> dayRows = new ArrayList<>();
        for (Map.Entry<LocalDate, Long> e : eventsByDay.entrySet()) {
            LocalDate d = e.getKey();
            long ev = e.getValue();
            long stud = studentsByDay.getOrDefault(d, Set.of()).size();
            dayRows.add(new TestAnalyticsDayDto(d.toString(), ev, stud));
        }

        TestAnalyticsDto dto =
                new TestAnalyticsDto(
                        test.getId(),
                        test.getName(),
                        test.getStatus(),
                        totalStudents,
                        completedUserIds.size(),
                        studentsWithAnyRow.size(),
                        studentsWithNonEmpty.size(),
                        totalAnswerRows,
                        ordered.size(),
                        questionRows,
                        questionColumns,
                        studentRows,
                        groupRows,
                        statusSlices,
                        attemptRows,
                        dayRows);
        return Optional.of(dto);
    }

    /** Проверяет, что ответ содержит непустой текст. */
    private static boolean isNonEmptyAnswerContent(String content) {
        return content != null && !content.isBlank();
    }

    /** Преобразует тест в DTO прохождения для студента. */
    private StudentTestDetailDto toStudentDetailDto(EduTest t, Long studentUserId) {
        List<TestQuestion> ordered =
                t.getQuestions().stream()
                        .sorted(Comparator.comparingInt(TestQuestion::getSortOrder))
                        .collect(Collectors.toList());

        List<Long> questionIds = ordered.stream().map(TestQuestion::getId).collect(Collectors.toList());
        Map<Long, String> answerByQuestionId = new HashMap<>();
        Map<Long, Integer> attemptsByQuestionId = new HashMap<>();
        Map<Long, String> statusByQuestionId = new HashMap<>();
        if (!questionIds.isEmpty()) {
            List<TestQuestionAnswer> existing =
                    testQuestionAnswerRepository.findByTestQuestion_IdInAndStudentUserId(
                            questionIds, studentUserId);
            for (TestQuestionAnswer a : existing) {
                answerByQuestionId.put(a.getTestQuestion().getId(), a.getContent());
                attemptsByQuestionId.put(a.getTestQuestion().getId(), a.getAttemptsUsed());
                statusByQuestionId.put(a.getTestQuestion().getId(), a.getSolutionStatus());
            }
        }

        Set<Long> assignmentIds =
                ordered.stream().map(TestQuestion::getAssignmentId).collect(Collectors.toSet());
        Map<Long, Assignment> assignmentMap =
                assignmentRepository.findAllById(assignmentIds).stream()
                        .collect(Collectors.toMap(Assignment::getId, a -> a));

        Set<Long> taskIds =
                ordered.stream()
                        .map(TestQuestion::getAssignmentTaskId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
        Map<Long, AssignmentTask> taskMap =
                assignmentTaskRepository.findAllById(taskIds).stream()
                        .collect(Collectors.toMap(AssignmentTask::getId, x -> x));

        StudentTestDetailDto dto = new StudentTestDetailDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setStartDate(t.getStartDate());
        dto.setEndDate(t.getEndDate());
        int total = t.getTotalTimeMinutes() != null ? t.getTotalTimeMinutes() : 0;
        dto.setTotalTimeMinutes(total > 0 ? total : null);
        dto.setAllowLateSubmission(t.isAllowLateSubmission());

        int studentIndexInTest = studentIndexForTest(t, studentUserId);

        for (TestQuestion q : ordered) {
            StudentTestQuestionDto qd = new StudentTestQuestionDto();
            qd.setTestQuestionId(q.getId());
            qd.setSortOrder(q.getSortOrder());
            Assignment a = assignmentMap.get(q.getAssignmentId());
            qd.setAssignmentName(a != null ? a.getName() : "Тема #" + q.getAssignmentId());
            if (q.getAssignmentTaskId() != null) {
                AssignmentTask task = taskMap.get(q.getAssignmentTaskId());
                qd.setTaskName(task != null ? task.getTitle() : "Задача #" + q.getAssignmentTaskId());
                List<AssignmentVariant> variants =
                        assignmentVariantRepository.findByTaskIdOrderByIdAsc(q.getAssignmentTaskId());
                AssignmentVariant selectedVariant =
                        pickVariantForStudent(variants, q.isIndividualVariants(), studentIndexInTest);
                String fromVariant = selectedVariant != null ? contentForClient(selectedVariant.getContent()) : "";
                if (fromVariant != null && !fromVariant.isBlank()) {
                    qd.setTaskContent(fromVariant.trim());
                } else {
                    qd.setTaskContent(task != null && task.getTitle() != null ? task.getTitle().trim() : "");
                }
                if (task != null) {
                    qd.setInputFormat(task.getInputFormat());
                    qd.setOutputFormat(task.getOutputFormat());
                    qd.setJudgeTimeLimitMs(task.getJudgeTimeLimitMs());
                    qd.setJudgeMemoryLimitKb(task.getJudgeMemoryLimitKb());
                }
                if (task != null) {
                    List<TaskTestCase> openCases;
                    if (selectedVariant != null && selectedVariant.getId() != null) {
                        openCases = taskTestCaseRepository
                                .findByTaskIdAndVariantIdAndIsPublicTrueAndActiveTrueOrderByIdAsc(
                                        task.getId(), selectedVariant.getId());
                    } else {
                        openCases = List.of();
                    }
                    if (openCases.isEmpty()) {
                        openCases = taskTestCaseRepository
                                .findByTaskIdAndVariantIdIsNullAndIsPublicTrueAndActiveTrueOrderByIdAsc(task.getId());
                    }
                    List<StudentVisibleTestCaseDto> visibleRows = new ArrayList<>();
                    for (TaskTestCase tc : openCases) {
                        StudentVisibleTestCaseDto row = new StudentVisibleTestCaseDto();
                        row.setInputData(tc.getInputData());
                        row.setExpectedOutput(tc.getExpectedOutput());
                        visibleRows.add(row);
                    }
                    qd.setOpenTestCases(visibleRows);
                }
            } else {
                qd.setTaskName("—");
                qd.setTaskContent("");
            }
            qd.setMaxAttempts(q.getMaxAttempts());
            qd.setSolveTimeMinutes(q.getSolveTimeMinutes());
            qd.setIndividualVariants(q.isIndividualVariants());
            qd.setSavedAnswer(answerByQuestionId.get(q.getId()));
            qd.setAttemptsUsed(attemptsByQuestionId.getOrDefault(q.getId(), 0));
            String st = statusByQuestionId.getOrDefault(q.getId(), STATUS_NONE);
            qd.setSolutionStatus(st);
            qd.setStatusLabel(statusLabelRu(st));
            dto.getQuestions().add(qd);
        }
        return dto;
    }

    /** Преобразует jsonb-представление контента в текст для API. */
    private static String contentForClient(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            JsonNode node = JSON.readTree(raw);
            if (node.isTextual()) {
                return node.asText();
            }
            if (node.isObject()) {
                for (String key : new String[] {"text", "body", "markdown", "content", "html"}) {
                    JsonNode child = node.get(key);
                    if (child != null && child.isTextual()) {
                        return child.asText();
                    }
                }
            }
            return node.isValueNode() && !node.isTextual() ? node.asText() : node.toString();
        } catch (Exception ignored) {
            return raw;
        }
    }

    /** Нормализует вывод программы для корректного сравнения. */
    private static String normalizeOutput(String s) {
        if (s == null) {
            return "";
        }
        String unix = s.replace("\r\n", "\n").replace('\r', '\n');
        String[] lines = unix.split("\n", -1);
        List<String> cleaned = new ArrayList<>(lines.length);
        for (String line : lines) {
            cleaned.add(stripTrailingSpaces(line));
        }
        while (!cleaned.isEmpty() && cleaned.get(cleaned.size() - 1).isEmpty()) {
            cleaned.remove(cleaned.size() - 1);
        }
        return String.join("\n", cleaned);
    }

    /** Удаляет хвостовые пробелы в строке. */
    private static String stripTrailingSpaces(String s) {
        int end = s.length();
        while (end > 0 && Character.isWhitespace(s.charAt(end - 1))) {
            end--;
        }
        return s.substring(0, end);
    }

    /** Возвращает текст условия задачи с учетом индивидуальных вариантов. */
    private static String taskTextForStudent(
            AssignmentTask task,
            List<AssignmentVariant> variants,
            boolean individualVariants,
            int studentIndexInTest) {
        AssignmentVariant selected = pickVariantForStudent(variants, individualVariants, studentIndexInTest);
        String fromVariant = "";
        if (selected != null) {
            fromVariant = contentForClient(selected.getContent());
        }
        if (fromVariant != null && !fromVariant.isBlank()) {
            return fromVariant.trim();
        }
        return task != null && task.getTitle() != null ? task.getTitle().trim() : "";
    }

    /** Выбирает вариант задачи для студента по его индексу в тесте. */
    private static AssignmentVariant pickVariantForStudent(
            List<AssignmentVariant> variants,
            boolean individualVariants,
            int studentIndexInTest) {
        if (variants == null || variants.isEmpty()) {
            return null;
        }
        if (!individualVariants) {
            return variants.get(0);
        }
        if (variants.size() <= 1) {
            return variants.get(0);
        }
        List<AssignmentVariant> pool = variants.subList(1, variants.size());
        int pick = Math.floorMod(studentIndexInTest, pool.size());
        return pool.get(pick);
    }

    /** Вычисляет индекс студента в списке участников теста. */
    private int studentIndexForTest(EduTest test, Long userId) {
        Set<Long> groupIds =
                test.getGroupLinks().stream().map(TestGroupLink::getGroupId).collect(Collectors.toSet());
        if (groupIds.isEmpty() || userId == null) {
            return 0;
        }
        List<Long> ids = userRepository.findDistinctStudentIdsByGroupIdsOrderById(groupIds);
        for (int i = 0; i < ids.size(); i++) {
            if (userId.equals(ids.get(i))) {
                return i;
            }
        }
        return 0;
    }

    /** Преобразует тест в детальный DTO для режима преподавателя. */
    private TestDetailDto toDetailDto(EduTest t) {
        List<TestQuestion> ordered =
                t.getQuestions().stream()
                        .sorted(Comparator.comparingInt(TestQuestion::getSortOrder))
                        .collect(Collectors.toList());

        Set<Long> groupIds =
                t.getGroupLinks().stream().map(TestGroupLink::getGroupId).collect(Collectors.toSet());
        Map<Long, GroupEntity> groupMap =
                groupRepository.findAllById(groupIds).stream()
                        .collect(Collectors.toMap(GroupEntity::getId, g -> g));

        Set<Long> assignmentIds =
                ordered.stream().map(TestQuestion::getAssignmentId).collect(Collectors.toSet());
        Map<Long, Assignment> assignmentMap =
                assignmentRepository.findAllById(assignmentIds).stream()
                        .collect(Collectors.toMap(Assignment::getId, a -> a));

        Set<Long> taskIds =
                ordered.stream()
                        .map(TestQuestion::getAssignmentTaskId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
        Map<Long, AssignmentTask> taskMap =
                assignmentTaskRepository.findAllById(taskIds).stream()
                        .collect(Collectors.toMap(AssignmentTask::getId, x -> x));

        TestDetailDto dto = new TestDetailDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setStartDate(t.getStartDate());
        dto.setEndDate(t.getEndDate());
        dto.setAllowLateSubmission(t.isAllowLateSubmission());
        dto.setStatus(t.getStatus());
        int total = t.getTotalTimeMinutes() != null ? t.getTotalTimeMinutes() : 0;
        dto.setTotalTimeMinutes(total > 0 ? total : null);

        for (TestGroupLink link : t.getGroupLinks()) {
            TestDetailGroupDto g = new TestDetailGroupDto();
            g.setId(link.getGroupId());
            GroupEntity ge = groupMap.get(link.getGroupId());
            g.setName(ge != null ? ge.getName() : "Группа #" + link.getGroupId());
            dto.getGroups().add(g);
        }

        for (TestQuestion q : ordered) {
            TestDetailQuestionDto qd = new TestDetailQuestionDto();
            qd.setAssignmentId(q.getAssignmentId());
            qd.setAssignmentTaskId(q.getAssignmentTaskId());
            Assignment a = assignmentMap.get(q.getAssignmentId());
            qd.setAssignmentName(a != null ? a.getName() : "Тема #" + q.getAssignmentId());
            if (q.getAssignmentTaskId() != null) {
                AssignmentTask task = taskMap.get(q.getAssignmentTaskId());
                qd.setTaskName(task != null ? task.getTitle() : "Задача #" + q.getAssignmentTaskId());
            } else {
                qd.setTaskName("—");
            }
            qd.setMaxAttempts(q.getMaxAttempts());
            qd.setSolveTimeMinutes(q.getSolveTimeMinutes());
            qd.setIndividualVariants(q.isIndividualVariants());
            dto.getQuestions().add(qd);
        }

        return dto;
    }

    /** Создает новый тест преподавателя. */
    @Transactional
    public TestCreatedDto create(Long teacherId, CreateTestRequest request) {
        if (teacherId == null) {
            throw new IllegalArgumentException("teacher id required");
        }
        ValidatedPayload v = validateForSave(teacherId, request);
        EduTest test = new EduTest();
        test.setTeacherId(teacherId);
        populateTest(test, request, v);
        EduTest saved = eduTestRepository.save(test);
        return toCreated(saved);
    }

    /** Обновляет существующий тест преподавателя. */
    @Transactional
    public TestCreatedDto update(Long teacherId, Long testId, CreateTestRequest request) {
        if (teacherId == null) {
            throw new IllegalArgumentException("teacher id required");
        }
        EduTest test =
                eduTestRepository
                        .findByIdAndTeacherId(testId, teacherId)
                        .orElseThrow(() -> new IllegalArgumentException("test not found"));
        ValidatedPayload v = validateForSave(teacherId, request);
        populateTest(test, request, v);
        EduTest saved = eduTestRepository.save(test);
        return toCreated(saved);
    }

    /** Удаляет тест преподавателя. */
    @Transactional
    public void deleteForTeacher(Long teacherId, Long testId) {
        if (teacherId == null) {
            throw new IllegalArgumentException("teacher id required");
        }
        EduTest test =
                eduTestRepository
                        .findByIdAndTeacherId(testId, teacherId)
                        .orElseThrow(() -> new IllegalArgumentException("test not found"));
        eduTestRepository.delete(test);
    }

    /** Заполняет сущность теста данными запроса и связями. */
    private void populateTest(EduTest test, CreateTestRequest request, ValidatedPayload v) {
        List<CreateTestQuestionItem> items = request.getQuestions();

        test.setName(request.getName().trim());
        test.setStartDate(request.getStartDate());
        test.setEndDate(request.getEndDate());
        Integer totalMin = request.getTotalTimeMinutes();
        test.setTotalTimeMinutes(totalMin != null ? totalMin : 0);
        test.setAllowLateSubmission(request.isAllowLateSubmission());
        test.setStatus(v.status);

        test.getGroupLinks().clear();
        test.getQuestions().clear();
        entityManager.flush();

        for (Long gid : v.uniqueGroups) {
            TestGroupLink link = new TestGroupLink();
            link.setTest(test);
            link.setGroupId(gid);
            test.getGroupLinks().add(link);
        }

        for (int i = 0; i < items.size(); i++) {
            CreateTestQuestionItem item = items.get(i);
            TestQuestion q = new TestQuestion();
            q.setTest(test);
            q.setAssignmentId(item.getAssignmentId());
            q.setAssignmentTaskId(item.getAssignmentTaskId());
            q.setIndividualVariants(item.isIndividualVariants());
            q.setMaxAttempts(item.getMaxAttempts() != null ? item.getMaxAttempts() : 1);
            q.setSolveTimeMinutes(item.getSolveTimeMinutes());
            q.setSortOrder(i);
            test.getQuestions().add(q);
        }
    }

    /** Валидирует данные теста перед созданием или обновлением. */
    private ValidatedPayload validateForSave(Long teacherId, CreateTestRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        if (request.getGroupIds() == null || request.getGroupIds().isEmpty()) {
            throw new IllegalArgumentException("at least one group is required");
        }
        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("at least one task is required");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("start and end dates are required");
        }
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("end date must be after start date");
        }

        String status = normalizeStatus(request.getStatus());

        LinkedHashSet<Long> uniqueGroups = new LinkedHashSet<>(request.getGroupIds());
        if (uniqueGroups.size() != request.getGroupIds().size()) {
            throw new IllegalArgumentException("duplicate groups");
        }
        for (Long gid : uniqueGroups) {
            if (gid == null || !groupRepository.existsById(gid)) {
                throw new IllegalArgumentException("group not found: " + gid);
            }
        }

        LinkedHashSet<Long> seenTaskIds = new LinkedHashSet<>();
        List<CreateTestQuestionItem> items = request.getQuestions();
        for (int i = 0; i < items.size(); i++) {
            CreateTestQuestionItem item = items.get(i);
            if (item == null) {
                throw new IllegalArgumentException("each question must be a non-null object");
            }
            if (item.getAssignmentId() == null || item.getAssignmentTaskId() == null) {
                throw new IllegalArgumentException("each question needs assignmentId and assignmentTaskId");
            }
            if (!assignmentRepository.existsByIdAndTeacherId(item.getAssignmentId(), teacherId)) {
                throw new IllegalArgumentException("assignment not found or access denied: " + item.getAssignmentId());
            }
            assignmentTaskRepository
                    .findByIdAndAssignmentId(item.getAssignmentTaskId(), item.getAssignmentId())
                    .orElseThrow(() -> new IllegalArgumentException("task does not belong to selected theme"));
            if (!seenTaskIds.add(item.getAssignmentTaskId())) {
                throw new IllegalArgumentException("the same task cannot be added twice");
            }
            if (item.getMaxAttempts() == null || item.getMaxAttempts() < 1) {
                throw new IllegalArgumentException("maxAttempts must be at least 1");
            }
            if (item.getSolveTimeMinutes() != null && item.getSolveTimeMinutes() < 1) {
                throw new IllegalArgumentException("solveTimeMinutes must be positive or null");
            }
        }

        validateIndividualVariantsConstraints(uniqueGroups, items);

        return new ValidatedPayload(status, uniqueGroups);
    }

    /** Проверяет ограничения по индивидуальным вариантам для выбранных групп. */
    private void validateIndividualVariantsConstraints(
            LinkedHashSet<Long> uniqueGroups, List<CreateTestQuestionItem> items) {
        List<Integer> variantCounts = new ArrayList<>();
        for (CreateTestQuestionItem item : items) {
            if (!item.isIndividualVariants()) {
                continue;
            }
            long vc = assignmentVariantRepository.countByTaskId(item.getAssignmentTaskId());
            if (vc < 1) {
                throw new IllegalArgumentException(
                        "Для задания с индивидуальными вариантами нужен хотя бы один вариант в теме.");
            }
            variantCounts.add((int) vc);
        }
        if (variantCounts.isEmpty()) {
            return;
        }
        int minVariants = variantCounts.stream().min(Comparator.naturalOrder()).orElse(0);
        long studentCount = userRepository.countDistinctStudentsInGroups(uniqueGroups);
        if (studentCount > minVariants) {
            throw new IllegalArgumentException(
                    "Нельзя включить индивидуальные варианты: в выбранных группах "
                            + studentCount
                            + " студентов, а по одному из заданий с этим флагом только "
                            + minVariants
                            + " вариант(ов). Нужно не меньше вариантов, чем студентов (по каждому такому заданию).");
        }
    }

    /** Преобразует сохраненный тест в DTO ответа create/update. */
    private static TestCreatedDto toCreated(EduTest saved) {
        TestCreatedDto dto = new TestCreatedDto();
        dto.setId(saved.getId());
        dto.setName(saved.getName());
        dto.setStatus(saved.getStatus());
        return dto;
    }

    /** Преобразует тест в краткое DTO списка преподавателя. */
    private TestListItemDto toListItem(EduTest t) {
        TestListItemDto d = new TestListItemDto();
        d.setId(t.getId());
        d.setName(t.getName());
        d.setStatus(t.getStatus());
        d.setCreatedAt(t.getCreatedAt());
        d.setUpdatedAt(t.getUpdatedAt());
        return d;
    }

    /** Нормализует статус теста и проверяет допустимые значения. */
    private static String normalizeStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return "draft";
        }
        String s = raw.trim().toLowerCase();
        if ("draft".equals(s) || "active".equals(s) || "archived".equals(s)) {
            return s;
        }
        throw new IllegalArgumentException("status must be draft, active or archived");
    }

    private record ValidatedPayload(String status, LinkedHashSet<Long> uniqueGroups) {}
}
