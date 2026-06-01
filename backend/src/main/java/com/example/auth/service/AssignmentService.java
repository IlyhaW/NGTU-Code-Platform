package com.example.auth.service;

import com.example.auth.dto.AssignmentDetailDto;
import com.example.auth.dto.AssignmentDto;
import com.example.auth.dto.AssignmentTaskDto;
import com.example.auth.dto.CreateTaskRequest;
import com.example.auth.dto.CreateTaskTestCaseRequest;
import com.example.auth.dto.CreateVariantRequest;
import com.example.auth.dto.GenerateVariantsRequest;
import com.example.auth.dto.TaskDetailDto;
import com.example.auth.dto.TaskTestCaseDto;
import com.example.auth.dto.TaskTestCasesViewDto;
import com.example.auth.dto.UpdateAssignmentRequest;
import com.example.auth.dto.UpdateVariantRequest;
import com.example.auth.dto.VariantDetailDto;
import com.example.auth.dto.VariantSummaryDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.auth.entity.Assignment;
import com.example.auth.entity.AssignmentTask;
import com.example.auth.entity.AssignmentVariant;
import com.example.auth.entity.TaskTestCase;
import com.example.auth.repository.AssignmentRepository;
import com.example.auth.repository.AssignmentTaskRepository;
import com.example.auth.repository.AssignmentVariantRepository;
import com.example.auth.repository.TaskTestCaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
/**
 * Сервис управления темами, задачами, вариантами и тест-кейсами.
 */
public class AssignmentService {
    private static final ObjectMapper JSON = new ObjectMapper();

    private final AssignmentRepository assignmentRepository;
    private final AssignmentTaskRepository assignmentTaskRepository;
    private final AssignmentVariantRepository assignmentVariantRepository;
    private final TaskTestCaseRepository taskTestCaseRepository;
    private final AiVariantGenerator aiVariantGenerator;

    /**
     * Создает сервис тем и внедряет зависимости.
     */
    public AssignmentService(AssignmentRepository assignmentRepository,
                             AssignmentTaskRepository assignmentTaskRepository,
                             AssignmentVariantRepository assignmentVariantRepository,
                             TaskTestCaseRepository taskTestCaseRepository,
                             AiVariantGenerator aiVariantGenerator) {
        this.assignmentRepository = assignmentRepository;
        this.assignmentTaskRepository = assignmentTaskRepository;
        this.assignmentVariantRepository = assignmentVariantRepository;
        this.taskTestCaseRepository = taskTestCaseRepository;
        this.aiVariantGenerator = aiVariantGenerator;
    }

    /** Возвращает все темы без фильтрации по преподавателю. */
    public List<AssignmentDto> findAll() {
        return assignmentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** Возвращает темы конкретного преподавателя. */
    public List<AssignmentDto> findAllByTeacherId(Long teacherId) {
        return assignmentRepository.findAllByTeacherIdOrderByCreatedAtDesc(teacherId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** Создает новую тему преподавателя и возвращает ее полные данные. */
    @Transactional
    public AssignmentDetailDto createAssignment(Long teacherId, UpdateAssignmentRequest request) {
        if (teacherId == null) {
            throw new IllegalArgumentException("teacher id is required");
        }
        Assignment a = new Assignment();
        String name =
                request != null && request.getName() != null && !request.getName().isBlank()
                        ? request.getName().trim()
                        : "Новая тема";
        a.setName(name);
        a.setTeacherId(teacherId);
        a.setVariantsCount(0);
        a.setTags(request != null ? tagsToString(request.getTags()) : null);
        Assignment saved = assignmentRepository.save(a);
        return findByIdAndTeacherId(saved.getId(), teacherId).orElseThrow();
    }

    /** Возвращает тему и список ее задач для указанного преподавателя. */
    public Optional<AssignmentDetailDto> findByIdAndTeacherId(Long id, Long teacherId) {
        return assignmentRepository.findById(id)
                .filter(a -> a.getTeacherId().equals(teacherId))
                .map(a -> {
                    AssignmentDetailDto dto = new AssignmentDetailDto();
                    dto.setId(a.getId());
                    dto.setName(a.getName());
                    dto.setTeacherId(a.getTeacherId());
                    dto.setVariantsCount(a.getVariantsCount());
                    dto.setTags(parseTags(a.getTags()));
                    List<AssignmentTaskDto> tasks = assignmentTaskRepository
                            .findByAssignmentIdOrderBySortOrderAscIdAsc(a.getId()).stream()
                            .map(t -> {
                                AssignmentTaskDto td = new AssignmentTaskDto();
                                td.setId(t.getId());
                                td.setName(t.getTitle());
                                td.setTags(parseTags(t.getTags()));
                                td.setVariantsCount((int) assignmentVariantRepository.countByTaskId(t.getId()));
                                return td;
                            })
                            .collect(Collectors.toList());
                    dto.setTasks(tasks);
                    return dto;
                });
    }

    /** Возвращает задачу темы и список ее вариантов. */
    public Optional<TaskDetailDto> findTaskByIdAndTeacherId(Long assignmentId, Long taskId, Long teacherId) {
        return assignmentRepository.findById(assignmentId)
                .filter(a -> a.getTeacherId().equals(teacherId))
                .flatMap(a -> assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId)
                        .map(task -> {
                            TaskDetailDto dto = new TaskDetailDto();
                            dto.setId(task.getId());
                            dto.setAssignmentId(assignmentId);
                            dto.setTitle(task.getTitle());
                            dto.setTags(parseTags(task.getTags()));
                            dto.setInputFormat(task.getInputFormat());
                            dto.setOutputFormat(task.getOutputFormat());
                            dto.setJudgeTimeLimitMs(task.getJudgeTimeLimitMs());
                            dto.setJudgeMemoryLimitKb(task.getJudgeMemoryLimitKb());
                            dto.setSolutionAlgorithm(task.getSolutionAlgorithm());
                            dto.setVariants(assignmentVariantRepository.findByTaskIdOrderByIdAsc(task.getId()).stream()
                                    .map(v -> {
                                        VariantSummaryDto s = new VariantSummaryDto();
                                        s.setId(v.getId());
                                        s.setName(v.getVariantName());
                                        return s;
                                    })
                                    .collect(Collectors.toList()));
                            return dto;
                        }));
    }

    /** Создает задачу внутри темы и добавляет исходный вариант. */
    @Transactional
    public TaskDetailDto createTask(Long assignmentId, Long teacherId, CreateTaskRequest request) {
        Assignment a = assignmentRepository.findById(assignmentId)
                .filter(as -> as.getTeacherId().equals(teacherId))
                .orElseThrow(() -> new IllegalArgumentException("assignment not found"));
        int nextOrder = (int) assignmentTaskRepository.countByAssignmentId(assignmentId);
        AssignmentTask task = new AssignmentTask();
        task.setAssignmentId(assignmentId);
        task.setTitle(request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle().trim() : "Новая задача");
        task.setTags(tagsToString(request.getTags()));
        task.setInputFormat(trimToNull(request.getInputFormat()));
        task.setOutputFormat(trimToNull(request.getOutputFormat()));
        task.setJudgeTimeLimitMs(normalizePositiveInt(request.getJudgeTimeLimitMs(), 100, 120000, null));
        task.setJudgeMemoryLimitKb(normalizePositiveInt(request.getJudgeMemoryLimitKb(), 1024, 8388608, null));
        task.setSolutionAlgorithm(trimToNull(request.getSolutionAlgorithm()));
        task.setSortOrder(nextOrder);
        task = assignmentTaskRepository.save(task);
        AssignmentVariant v = new AssignmentVariant();
        v.setTaskId(task.getId());
        v.setVariantName("Исходный вариант");
        v.setContent(contentForPersistence(""));
        assignmentVariantRepository.save(v);
        recalcVariantsCount(a);
        return findTaskByIdAndTeacherId(assignmentId, task.getId(), teacherId).orElseThrow();
    }

    /** Обновляет параметры задачи темы. */
    public boolean updateTaskTitle(Long assignmentId, Long taskId, Long teacherId, CreateTaskRequest request) {
        if (!assignmentRepository.existsByIdAndTeacherId(assignmentId, teacherId)) {
            return false;
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return false;
        }
        Optional<AssignmentTask> opt = assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId);
        if (opt.isEmpty()) return false;
        AssignmentTask t = opt.get();
        t.setTitle(request.getTitle().trim());
        if (request.getTags() != null) {
            t.setTags(tagsToString(request.getTags()));
        }
        t.setInputFormat(trimToNull(request.getInputFormat()));
        t.setOutputFormat(trimToNull(request.getOutputFormat()));
        t.setJudgeTimeLimitMs(normalizePositiveInt(request.getJudgeTimeLimitMs(), 100, 120000, null));
        t.setJudgeMemoryLimitKb(normalizePositiveInt(request.getJudgeMemoryLimitKb(), 1024, 8388608, null));
        if (request.getSolutionAlgorithm() != null) {
            t.setSolutionAlgorithm(trimToNull(request.getSolutionAlgorithm()));
        }
        assignmentTaskRepository.save(t);
        return true;
    }

    /** Удаляет задачу из темы преподавателя. */
    @Transactional
    public boolean deleteTask(Long assignmentId, Long taskId, Long teacherId) {
        Optional<Assignment> a = assignmentRepository.findById(assignmentId)
                .filter(as -> as.getTeacherId().equals(teacherId));
        if (a.isEmpty()) return false;
        Optional<AssignmentTask> task = assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId);
        if (task.isEmpty()) return false;
        assignmentTaskRepository.delete(task.get());
        recalcVariantsCount(a.get());
        return true;
    }

    /** Возвращает конкретный вариант задачи. */
    public Optional<VariantDetailDto> getVariant(Long assignmentId, Long taskId, Long variantId, Long teacherId) {
        if (!assignmentRepository.existsByIdAndTeacherId(assignmentId, teacherId)) {
            return Optional.empty();
        }
        return assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId)
                .flatMap(t -> assignmentVariantRepository.findById(variantId)
                        .filter(v -> v.getTaskId().equals(taskId))
                        .map(v -> toVariantDetailDto(v, assignmentId)));
    }

    /** Возвращает набор тест-кейсов для варианта задачи. */
    public Optional<TaskTestCasesViewDto> getTaskTestCases(
            Long assignmentId, Long taskId, Long variantId, Long teacherId) {
        if (!assignmentRepository.existsByIdAndTeacherId(assignmentId, teacherId)) {
            return Optional.empty();
        }
        Optional<AssignmentTask> taskOpt = assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId);
        if (taskOpt.isEmpty()) {
            return Optional.empty();
        }
        Optional<AssignmentVariant> variantOpt = assignmentVariantRepository.findById(variantId)
                .filter(v -> v.getTaskId().equals(taskId));
        if (variantOpt.isEmpty()) {
            return Optional.empty();
        }

        AssignmentTask task = taskOpt.get();
        AssignmentVariant variant = variantOpt.get();
        List<TaskTestCase> activeCases = taskTestCaseRepository
                .findByTaskIdAndVariantIdAndActiveTrueOrderByIdAsc(taskId, variantId);
        if (activeCases.isEmpty()) {
            activeCases = taskTestCaseRepository.findByTaskIdAndVariantIdIsNullAndActiveTrueOrderByIdAsc(taskId);
        }

        TaskTestCasesViewDto dto = new TaskTestCasesViewDto();
        dto.setAssignmentId(assignmentId);
        dto.setTaskId(taskId);
        dto.setVariantId(variantId);
        dto.setTaskTitle(task.getTitle());
        dto.setVariantName(variant.getVariantName());
        dto.setVariantContent(contentForClient(variant.getContent()));

        List<TaskTestCaseDto> open = new ArrayList<>();
        List<TaskTestCaseDto> hidden = new ArrayList<>();
        for (TaskTestCase tc : activeCases) {
            TaskTestCaseDto row = new TaskTestCaseDto();
            row.setId(tc.getId());
            row.setInputData(tc.getInputData());
            row.setExpectedOutput(tc.getExpectedOutput());
            if (tc.isPublic()) {
                open.add(row);
            } else {
                hidden.add(row);
            }
        }
        dto.setOpenCases(open);
        dto.setHiddenCases(hidden);
        return Optional.of(dto);
    }

    /** Добавляет новый тест-кейс к варианту задачи. */
    @Transactional
    public Optional<TaskTestCaseDto> addTaskTestCase(
            Long assignmentId,
            Long taskId,
            Long variantId,
            Long teacherId,
            CreateTaskTestCaseRequest request) {
        if (!assignmentRepository.existsByIdAndTeacherId(assignmentId, teacherId)) {
            return Optional.empty();
        }
        Optional<AssignmentTask> taskOpt = assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId);
        if (taskOpt.isEmpty()) {
            return Optional.empty();
        }
        Optional<AssignmentVariant> variantOpt = assignmentVariantRepository.findById(variantId)
                .filter(v -> v.getTaskId().equals(taskId));
        if (variantOpt.isEmpty()) {
            return Optional.empty();
        }
        AssignmentTask task = taskOpt.get();
        TaskTestCase row = new TaskTestCase();
        row.setTaskId(taskId);
        row.setVariantId(variantId);
        row.setInputData(request != null && request.getInputData() != null ? request.getInputData() : "");
        row.setExpectedOutput(request != null && request.getExpectedOutput() != null ? request.getExpectedOutput() : "");
        row.setActive(true);
        row.setPublic(request != null && Boolean.TRUE.equals(request.getIsPublic()));
        row.setTimeLimitMs(task.getJudgeTimeLimitMs() != null ? task.getJudgeTimeLimitMs() : 2000);
        row.setMemoryLimitKb(task.getJudgeMemoryLimitKb() != null ? task.getJudgeMemoryLimitKb() : 262144);
        row = taskTestCaseRepository.save(row);

        TaskTestCaseDto dto = new TaskTestCaseDto();
        dto.setId(row.getId());
        dto.setInputData(row.getInputData());
        dto.setExpectedOutput(row.getExpectedOutput());
        return Optional.of(dto);
    }

    /** Деактивирует тест-кейс варианта задачи. */
    @Transactional
    public boolean deleteTaskTestCase(
            Long assignmentId,
            Long taskId,
            Long variantId,
            Long testCaseId,
            Long teacherId) {
        if (!assignmentRepository.existsByIdAndTeacherId(assignmentId, teacherId)) {
            return false;
        }
        if (assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId).isEmpty()) {
            return false;
        }
        if (assignmentVariantRepository.findById(variantId).filter(v -> v.getTaskId().equals(taskId)).isEmpty()) {
            return false;
        }
        Optional<TaskTestCase> tc = taskTestCaseRepository.findById(testCaseId)
                .filter(x -> x.getTaskId().equals(taskId))
                .filter(TaskTestCase::isActive);
        if (tc.isEmpty()) {
            return false;
        }
        TaskTestCase row = tc.get();
        row.setActive(false);
        taskTestCaseRepository.save(row);
        return true;
    }

    /** Создает новый вариант формулировки задачи. */
    @Transactional
    public VariantDetailDto createVariant(Long assignmentId, Long taskId, Long teacherId, CreateVariantRequest request) {
        Assignment a = assignmentRepository.findById(assignmentId)
                .filter(as -> as.getTeacherId().equals(teacherId))
                .orElseThrow(() -> new IllegalArgumentException("assignment not found"));
        AssignmentTask task = assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("task not found"));
        AssignmentVariant v = new AssignmentVariant();
        v.setTaskId(task.getId());
        v.setVariantName(resolveNewVariantName(task.getId(), request.getVariantName()));
        v.setContent(contentForPersistence(request.getContent()));
        v = assignmentVariantRepository.save(v);
        recalcVariantsCount(a);
        return toVariantDetailDto(v, assignmentId);
    }

    /** Обновляет существующий вариант формулировки задачи. */
    @Transactional
    public boolean updateVariant(Long assignmentId, Long taskId, Long variantId, Long teacherId, UpdateVariantRequest request) {
        if (!assignmentRepository.existsByIdAndTeacherId(assignmentId, teacherId)) {
            return false;
        }
        Optional<AssignmentVariant> v = assignmentVariantRepository.findById(variantId)
                .filter(av -> av.getTaskId().equals(taskId));
        if (v.isEmpty()) return false;
        Optional<AssignmentTask> task = assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId);
        if (task.isEmpty()) return false;
        AssignmentVariant variant = v.get();
        if (request.getVariantName() != null && !request.getVariantName().isBlank()) {
            variant.setVariantName(request.getVariantName().trim());
        }
        if (request.getContent() != null) {
            variant.setContent(contentForPersistence(request.getContent()));
        }
        assignmentVariantRepository.save(variant);
        return true;
    }

    /** Удаляет вариант задачи, кроме исходного первого варианта. */
    @Transactional
    public boolean deleteVariant(Long assignmentId, Long taskId, Long variantId, Long teacherId) {
        Optional<Assignment> a = assignmentRepository.findById(assignmentId)
                .filter(as -> as.getTeacherId().equals(teacherId));
        if (a.isEmpty()) return false;
        if (assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId).isEmpty()) {
            return false;
        }
        List<AssignmentVariant> ordered = assignmentVariantRepository.findByTaskIdOrderByIdAsc(taskId);
        if (!ordered.isEmpty() && ordered.get(0).getId().equals(variantId)) {
            return false;
        }
        Optional<AssignmentVariant> v = assignmentVariantRepository.findById(variantId)
                .filter(av -> av.getTaskId().equals(taskId));
        if (v.isEmpty()) return false;
        assignmentVariantRepository.delete(v.get());
        recalcVariantsCount(a.get());
        return true;
    }

    /** Генерирует несколько вариантов задачи с открытыми и закрытыми тест-кейсами (без примеров в тексте условия). */
    @Transactional
    public List<VariantDetailDto> generateVariants(Long assignmentId, Long taskId, Long teacherId,
                                                   GenerateVariantsRequest request) {
        Assignment a = assignmentRepository.findById(assignmentId)
                .filter(as -> as.getTeacherId().equals(teacherId))
                .orElseThrow(() -> new IllegalArgumentException("assignment not found"));
        AssignmentTask task = assignmentTaskRepository.findByIdAndAssignmentId(taskId, assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("task not found"));
        List<AssignmentVariant> variants = assignmentVariantRepository.findByTaskIdOrderByIdAsc(task.getId());
        if (variants.isEmpty()) {
            throw new IllegalArgumentException("no variants");
        }
        boolean replace = Boolean.TRUE.equals(request.getReplaceExisting());
        if (replace) {
            for (int i = 1; i < variants.size(); i++) {
                assignmentVariantRepository.delete(variants.get(i));
            }
            recalcVariantsCount(a);
            variants = assignmentVariantRepository.findByTaskIdOrderByIdAsc(task.getId());
        }
        AssignmentVariant first = variants.get(0);
        int count = request.getCount() != null ? request.getCount() : 1;
        count = Math.min(Math.max(count, 1), 300);
        int difficulty = request.getDifficulty() != null ? request.getDifficulty() : 3;
        difficulty = Math.min(Math.max(difficulty, 1), 5);
        String style = request.getStyle() != null ? request.getStyle().trim() : "";
        if (request.getSolutionAlgorithm() != null) {
            task.setSolutionAlgorithm(trimToNull(request.getSolutionAlgorithm()));
            assignmentTaskRepository.save(task);
        }
        String solutionAlgorithm = task.getSolutionAlgorithm() != null ? task.getSolutionAlgorithm().trim() : "";
        if (solutionAlgorithm.isBlank()) {
            throw new IllegalArgumentException("Укажите алгоритм решения задачи перед генерацией вариантов.");
        }
        int memoryLimitKb = task.getJudgeMemoryLimitKb() != null ? task.getJudgeMemoryLimitKb() : 262144;
        int timeLimitMs = task.getJudgeTimeLimitMs() != null ? task.getJudgeTimeLimitMs() : 2000;
        String baseContent = contentForClient(first.getContent());
        int nonOriginalBefore = variants.size() - 1;
        String assignmentName = a.getName() != null ? a.getName() : "";
        String taskTitle = task.getTitle() != null ? task.getTitle() : "";
        String inputFormat = task.getInputFormat() != null ? task.getInputFormat() : "";
        String outputFormat = task.getOutputFormat() != null ? task.getOutputFormat() : "";
        List<AiVariantGenerator.GeneratedVariant> generatedTexts =
                aiVariantGenerator.generateDetailed(
                        assignmentName,
                        taskTitle,
                        baseContent,
                        solutionAlgorithm,
                        inputFormat,
                        outputFormat,
                        count,
                        difficulty,
                        style);
        List<VariantDetailDto> created = new ArrayList<>();
        taskTestCaseRepository.deactivateActiveByTaskId(task.getId());
        for (int j = 1; j <= generatedTexts.size(); j++) {
            AiVariantGenerator.GeneratedVariant draft = generatedTexts.get(j - 1);
            AssignmentVariant v = new AssignmentVariant();
            v.setTaskId(task.getId());
            v.setVariantName("Вариант " + (nonOriginalBefore + j));
            v.setContent(contentForPersistence(draft.content()));
            v = assignmentVariantRepository.save(v);
            int added = 0;
            for (AiVariantGenerator.GeneratedCase tc : draft.publicTests()) {
                added += saveGeneratedTestCase(
                        task.getId(), v.getId(), tc, true, timeLimitMs, memoryLimitKb);
            }
            for (AiVariantGenerator.GeneratedCase tc : draft.privateTests()) {
                added += saveGeneratedTestCase(
                        task.getId(), v.getId(), tc, false, timeLimitMs, memoryLimitKb);
            }
            if (added == 0) {
                TaskTestCase fallback = new TaskTestCase();
                fallback.setTaskId(task.getId());
                fallback.setVariantId(v.getId());
                fallback.setInputData("");
                fallback.setExpectedOutput("");
                fallback.setTimeLimitMs(timeLimitMs);
                fallback.setMemoryLimitKb(memoryLimitKb);
                fallback.setActive(true);
                fallback.setPublic(false);
                taskTestCaseRepository.save(fallback);
            }
            created.add(toVariantDetailDto(v, assignmentId));
        }
        recalcVariantsCount(a);
        return created;
    }

    /** Сохраняет один сгенерированный тест-кейс; возвращает 1 если строка создана, иначе 0. */
    private int saveGeneratedTestCase(
            Long taskId,
            Long variantId,
            AiVariantGenerator.GeneratedCase tc,
            boolean isPublic,
            int timeLimitMs,
            int memoryLimitKb) {
        if (tc == null) {
            return 0;
        }
        String input = tc.input() != null ? tc.input() : "";
        String expected = tc.output() != null ? tc.output() : "";
        if (input.isBlank() && expected.isBlank()) {
            return 0;
        }
        TaskTestCase row = new TaskTestCase();
        row.setTaskId(taskId);
        row.setVariantId(variantId);
        row.setInputData(input);
        row.setExpectedOutput(expected);
        row.setTimeLimitMs(timeLimitMs);
        row.setMemoryLimitKb(memoryLimitKb);
        row.setActive(true);
        row.setPublic(isPublic);
        taskTestCaseRepository.save(row);
        return 1;
    }

    /** Обновляет название и теги темы преподавателя. */
    public boolean updateAssignment(Long id, Long teacherId, UpdateAssignmentRequest request) {
        Optional<Assignment> opt = assignmentRepository.findById(id)
                .filter(a -> a.getTeacherId().equals(teacherId));
        if (opt.isEmpty()) return false;
        Assignment a = opt.get();
        if (request.getName() != null && !request.getName().isBlank()) a.setName(request.getName().trim());
        if (request.getTags() != null) a.setTags(tagsToString(request.getTags()));
        assignmentRepository.save(a);
        return true;
    }

    /** Удаляет тему преподавателя вместе со связанными данными. */
    @Transactional
    public boolean deleteAssignment(Long id, Long teacherId) {
        Optional<Assignment> opt = assignmentRepository.findById(id)
                .filter(a -> a.getTeacherId().equals(teacherId));
        if (opt.isEmpty()) return false;
        assignmentRepository.delete(opt.get());
        return true;
    }

    /** Преобразует сущность варианта в DTO-ответ API. */
    private VariantDetailDto toVariantDetailDto(AssignmentVariant v, Long assignmentId) {
        VariantDetailDto dto = new VariantDetailDto();
        dto.setId(v.getId());
        dto.setAssignmentId(assignmentId);
        dto.setTaskId(v.getTaskId());
        dto.setVariantName(v.getVariantName());
        dto.setContent(contentForClient(v.getContent()));
        return dto;
    }

    /** Пересчитывает общее число вариантов по теме. */
    private void recalcVariantsCount(Assignment a) {
        long cnt = assignmentVariantRepository.countVariantsForAssignment(a.getId());
        a.setVariantsCount((int) cnt);
        assignmentRepository.save(a);
    }

    /** Преобразует сущность темы в краткий DTO-объект. */
    private AssignmentDto toDto(Assignment a) {
        AssignmentDto dto = new AssignmentDto();
        dto.setId(a.getId());
        dto.setName(a.getName());
        dto.setTeacherId(a.getTeacherId());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setVariantsCount(a.getVariantsCount());
        dto.setTags(parseTags(a.getTags()));
        return dto;
    }

    /** Разбирает строку тегов в список. */
    private static List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** Собирает список тегов в строку для хранения в БД. */
    private static String tagsToString(List<String> tags) {
        if (tags == null || tags.isEmpty()) return null;
        return String.join(",", tags.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
    }

    /** Преобразует текст варианта в JSON-строку для хранения в jsonb. */
    private static String contentForPersistence(String content) {
        String value = content == null ? "" : content;
        try {
            return JSON.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("invalid variant content");
        }
    }

    /** Преобразует jsonb-представление варианта в обычный текст для API. */
    private static String contentForClient(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            JsonNode node = JSON.readTree(raw);
            return node.isTextual() ? node.asText() : node.toString();
        } catch (Exception ignored) {
            return raw;
        }
    }

    /** Вычисляет следующее свободное имя в формате «Вариант N». */
    private String allocateVariantName(Long taskId) {
        List<AssignmentVariant> all = assignmentVariantRepository.findByTaskIdOrderByIdAsc(taskId);
        int maxNum = 0;
        for (AssignmentVariant av : all) {
            String n = av.getVariantName();
            if (n == null || !n.startsWith("Вариант ")) {
                continue;
            }
            String rest = n.substring("Вариант ".length()).trim();
            int space = rest.indexOf(' ');
            if (space > 0) {
                rest = rest.substring(0, space);
            }
            try {
                maxNum = Math.max(maxNum, Integer.parseInt(rest));
            } catch (NumberFormatException ignored) {
            }
        }
        return "Вариант " + (maxNum + 1);
    }

    /** Возвращает итоговое имя нового варианта с учетом уникальности. */
    private String resolveNewVariantName(Long taskId, String requested) {
        if (requested == null || requested.isBlank()) {
            return allocateVariantName(taskId);
        }
        String t = requested.trim();
        List<AssignmentVariant> all = assignmentVariantRepository.findByTaskIdOrderByIdAsc(taskId);
        boolean taken = all.stream().anyMatch(av -> t.equals(av.getVariantName()));
        if (taken) {
            return allocateVariantName(taskId);
        }
        return t;
    }

    /** Нормализует числовой параметр в допустимые границы. */
    private static Integer normalizePositiveInt(Integer value, int min, int max, Integer fallback) {
        if (value == null) return fallback;
        int v = Math.max(min, Math.min(max, value));
        return v;
    }

    /** Обрезает строку и возвращает null для пустого значения. */
    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
