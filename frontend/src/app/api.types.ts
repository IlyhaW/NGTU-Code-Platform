/**
 * Роль пользователя в системе.
 */
export type Role = 'student' | 'teacher';

/**
 * Базовая информация об учебной группе.
 */
export interface GroupDto {
  id: number;
  name: string;
  createdAt?: string;
}

/**
 * Краткая информация об учебной группе преподавателя.
 */
export interface GroupSummaryDto {
  id: number;
  name: string;
  memberCount: number;
}

/**
 * Краткая информация об участнике учебной группы.
 */
export interface GroupMemberDto {
  id: number;
  fullName: string;
  login: string;
  role: string;
}

/**
 * Данные для регистрации пользователя.
 */
export interface RegisterRequest {
  fullName: string;
  login: string;
  password: string;
  role: Role;
  groupId: number | null;
}

/**
 * Данные для входа пользователя.
 */
export interface LoginRequest {
  login: string;
  password: string;
}

/**
 * Ответ сервера после успешной аутентификации.
 */
export interface LoginResponse {
  token: string;
  role: string;
}

/**
 * Профиль текущего авторизованного пользователя.
 */
export interface CurrentUserDto {
  id?: number;
  fullName: string;
  role: string;
  /** Название учебной группы, если пользователь к ней привязан. */
  groupName?: string | null;
}

/**
 * Краткая информация о теме (assignment).
 */
export interface AssignmentDto {
  id: number;
  name: string;
  teacherId: number;
  createdAt?: string;
  variantsCount?: number;
  tags: string[];
}

/**
 * Краткая информация о задаче в теме.
 */
export interface AssignmentTaskDto {
  id: number;
  name: string;
  tags?: string[];
  /**
   * Количество вариантов формулировок задачи.
   */
  variantsCount?: number;
}

/**
 * Краткая информация о варианте задачи.
 */
export interface VariantSummaryDto {
  id: number;
  name: string;
}

/**
 * Детальные данные задачи и ее вариантов.
 */
export interface TaskDetailDto {
  id: number;
  assignmentId: number;
  title: string;
  tags?: string[];
  inputFormat?: string | null;
  outputFormat?: string | null;
  judgeTimeLimitMs?: number | null;
  judgeMemoryLimitKb?: number | null;
  variants: VariantSummaryDto[];
}

/**
 * Данные для создания или обновления задачи.
 */
export interface CreateTaskRequest {
  title?: string;
  tags?: string[];
  inputFormat?: string | null;
  outputFormat?: string | null;
  judgeTimeLimitMs?: number | null;
  judgeMemoryLimitKb?: number | null;
}

/**
 * Детальные данные темы с задачами.
 */
export interface AssignmentDetailDto {
  id: number;
  name: string;
  teacherId: number;
  variantsCount?: number;
  tags: string[];
  tasks: AssignmentTaskDto[];
}

/**
 * Детальные данные варианта задачи.
 */
export interface VariantDetailDto {
  id: number;
  assignmentId: number;
  taskId: number;
  variantName: string;
  content: string | null;
}

/**
 * Один тест-кейс задачи.
 */
export interface TaskTestCaseDto {
  id: number;
  inputData: string;
  expectedOutput: string;
}

/**
 * Данные для добавления тест-кейса задачи.
 */
export interface CreateTaskTestCaseRequest {
  inputData?: string;
  expectedOutput?: string;
  isPublic?: boolean;
}

/**
 * Представление тест-кейсов выбранного варианта задачи.
 */
export interface TaskTestCasesViewDto {
  assignmentId: number;
  taskId: number;
  variantId: number;
  taskTitle: string;
  variantName: string;
  variantContent: string;
  openCases: TaskTestCaseDto[];
  hiddenCases: TaskTestCaseDto[];
}

/**
 * Данные для обновления темы.
 */
export interface UpdateAssignmentRequest {
  name?: string;
  tags?: string[];
}

/**
 * Данные для создания нового варианта задачи.
 */
export interface CreateVariantRequest {
  variantName?: string;
  content?: string;
}

/**
 * Параметры генерации вариантов задачи.
 */
export interface GenerateVariantsRequest {
  count?: number;
  difficulty?: number;
  style?: string;
  replaceExisting?: boolean;
}

/**
 * Данные для обновления существующего варианта.
 */
export interface UpdateVariantRequest {
  variantName?: string;
  content?: string;
}

/**
 * Описание выбранной задачи в создаваемом тесте.
 */
export interface CreateTestQuestionItem {
  assignmentId: number;
  assignmentTaskId: number;
  maxAttempts: number;
  solveTimeMinutes: number | null;
  individualVariants: boolean;
}

/**
 * Тело запроса на создание теста.
 */
export interface CreateTestRequest {
  name: string;
  groupIds: number[];
  questions: CreateTestQuestionItem[];
  startDate: string;
  endDate: string;
  totalTimeMinutes: number | null;
  allowLateSubmission: boolean;
  /**
   * Статус теста.
   */
  status: string;
}

/**
 * Ответ сервера после создания теста.
 */
export interface TestCreatedDto {
  id: number;
  name: string;
  status: string;
}

/**
 * Краткая информация о тесте в списке преподавателя.
 */
export interface TestListItemDto {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Краткая информация о тесте в списке студента.
 */
export interface StudentTestListItemDto {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  /**
   * Сводка тем теста.
   */
  topicsSummary: string;
  tags: string[];
  /**
   * Дата завершения теста.
   */
  completedAt?: string | null;
  /**
   * Общее время прохождения в секундах.
   */
  totalTimeSeconds?: number | null;
}

/**
 * Данные по одному вопросу в просмотре завершенного теста.
 */
export interface StudentCompletedQuestionReviewDto {
  testQuestionId: number;
  sortOrder: number;
  assignmentName: string;
  taskName: string;
  taskContent: string;
  maxAttempts: number;
  attemptsUsed: number;
  timeSpentSeconds: number | null;
  solutionContent: string;
  solutionStatus: string;
  statusLabel: string;
}

/**
 * Данные просмотрa завершенного теста студентом.
 */
export interface StudentCompletedTestReviewDto {
  testId: number;
  testName: string;
  completedAt: string;
  totalTimeSeconds: number | null;
  questions: StudentCompletedQuestionReviewDto[];
}

/**
 * Данные вопроса теста для прохождения студентом.
 */
export interface StudentTestQuestionDto {
  testQuestionId: number;
  sortOrder: number;
  assignmentName: string;
  taskName: string;
  taskContent: string;
  inputFormat: string | null;
  outputFormat: string | null;
  judgeTimeLimitMs: number | null;
  judgeMemoryLimitKb: number | null;
  openTestCases: { inputData: string; expectedOutput: string }[];
  solutionStatus: string;
  statusLabel: string;
  /**
   * Сохраненный ответ студента.
   */
  savedAnswer: string | null;
  attemptsUsed: number;
  maxAttempts: number;
  solveTimeMinutes: number | null;
  individualVariants: boolean;
}

/**
 * Ответ студента по одному вопросу теста.
 */
export interface StudentTestAnswerItemDto {
  testQuestionId: number;
  sortOrder: number;
  assignmentName: string;
  taskName: string;
  taskContent: string;
  attemptsUsed: number;
  solutionStatus: string;
  statusLabel: string;
  content: string;
}

/**
 * Строка отправки студента по тесту.
 */
export interface StudentTestSubmissionRowDto {
  studentId: number;
  fullName: string;
  answers: StudentTestAnswerItemDto[];
}

/**
 * Список отправок по тесту для преподавателя.
 */
export interface TestSubmissionsDto {
  testId: number;
  testName: string;
  students: StudentTestSubmissionRowDto[];
}

/**
 * Сводка по вопросу для аналитики теста.
 */
export interface TestAnalyticsQuestionRow {
  testQuestionId: number;
  sortOrder: number;
  assignmentName: string;
  taskName: string;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  studentsWithRecord: number;
  nonEmptyAnswers: number;
  avgAttempts: number;
  avgTimeSpentSeconds: number | null;
}

/**
 * Сводка по группе в аналитике теста.
 */
export interface TestAnalyticsGroupRow {
  groupId: number;
  groupName: string;
  studentsInGroup: number;
  completedInGroup: number;
  withNonEmptyAnswers: number;
}

/**
 * Срез распределения по статусам решений.
 */
export interface TestAnalyticsStatusSlice {
  status: string;
  count: number;
}

/**
 * Бин распределения по количеству попыток.
 */
export interface TestAnalyticsAttemptBin {
  label: string;
  count: number;
}

/**
 * Активность решений по дням.
 */
export interface TestAnalyticsDayRow {
  date: string;
  answerEvents: number;
  activeStudents: number;
}

/**
 * Полная аналитика теста для преподавателя.
 */
export interface TestAnalyticsDto {
  testId: number;
  testName: string;
  status: string;
  totalStudentsInGroups: number;
  completedStudents: number;
  studentsWithAnyAnswerRow: number;
  studentsWithNonEmptyAnswer: number;
  totalAnswerRows: number;
  questionCount: number;
  questions: TestAnalyticsQuestionRow[];
  byGroup: TestAnalyticsGroupRow[];
  statusDistribution: TestAnalyticsStatusSlice[];
  attemptDistribution: TestAnalyticsAttemptBin[];
  activityByDay: TestAnalyticsDayRow[];
}

/**
 * Результат проверки по одному тест-кейсу.
 */
export interface TestAnswerCheckCaseDto {
  testCaseId: number;
  passed: boolean;
  verdict: string;
  timeMs: number;
  memoryKb: number;
  message: string;
}

/**
 * Общий результат проверки ответа студента.
 */
export interface TestAnswerCheckDto {
  testId: number;
  testQuestionId: number;
  language: string;
  verdict: string;
  passedCount: number;
  totalCount: number;
  maxTimeMs: number;
  maxMemoryKb: number;
  message: string;
  cases: TestAnswerCheckCaseDto[];
}

/**
 * Детальные данные теста для прохождения студентом.
 */
export interface StudentTestDetailDto {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  totalTimeMinutes: number | null;
  allowLateSubmission: boolean;
  questions: StudentTestQuestionDto[];
}

/**
 * Группа, назначенная на тест.
 */
export interface TestDetailGroupDto {
  id: number;
  name: string;
}

/**
 * Вопрос теста в детальном представлении преподавателя.
 */
export interface TestDetailQuestionDto {
  assignmentId: number;
  assignmentTaskId: number;
  assignmentName: string;
  taskName: string;
  maxAttempts: number;
  solveTimeMinutes: number | null;
  individualVariants: boolean;
}

/**
 * Полные данные теста для редактирования преподавателем.
 */
export interface TestDetailDto {
  id: number;
  name: string;
  groups: TestDetailGroupDto[];
  questions: TestDetailQuestionDto[];
  startDate: string;
  endDate: string;
  totalTimeMinutes: number | null;
  allowLateSubmission: boolean;
  status: string;
}

