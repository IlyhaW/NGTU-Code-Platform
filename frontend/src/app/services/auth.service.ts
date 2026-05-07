import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AssignmentDetailDto,
  AssignmentDto,
  CreateTaskRequest,
  CreateVariantRequest,
  GenerateVariantsRequest,
  CurrentUserDto,
  GroupDto,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TaskDetailDto,
  UpdateAssignmentRequest,
  UpdateVariantRequest,
  VariantDetailDto,
  CreateTestRequest,
  TestCreatedDto,
  TestDetailDto,
  StudentTestListItemDto,
  StudentTestDetailDto,
  StudentCompletedTestReviewDto,
  TestSubmissionsDto,
  TestAnswerCheckDto,
  TestAnalyticsDto,
  TestListItemDto,
  GroupSummaryDto,
  GroupMemberDto,
  TaskTestCasesViewDto,
  CreateTaskTestCaseRequest,
} from '../api.types';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
/**
 * Клиент API для авторизации, тем, тестов и групп.
 */
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /**
   * Возвращает список доступных групп.
   */
  getGroups(): Observable<GroupDto[]> {
    return this.http.get<GroupDto[]>(`${this.apiUrl}/groups`);
  }

  /**
   * Регистрирует нового пользователя.
   */
  register(payload: RegisterRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, payload);
  }

  /**
   * Выполняет аутентификацию пользователя.
   */
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload);
  }

  /**
   * Возвращает список тем преподавателя.
   */
  getAssignments(): Observable<AssignmentDto[]> {
    return this.http.get<AssignmentDto[]>(`${this.apiUrl}/assignments`);
  }

  /**
   * Возвращает детальные данные темы.
   */
  getAssignment(id: number): Observable<AssignmentDetailDto> {
    return this.http.get<AssignmentDetailDto>(`${this.apiUrl}/assignments/${id}`);
  }

  /**
   * Создает новую тему.
   */
  createAssignment(body?: UpdateAssignmentRequest): Observable<AssignmentDetailDto> {
    return this.http.post<AssignmentDetailDto>(`${this.apiUrl}/assignments`, body ?? {});
  }

  /**
   * Обновляет параметры темы.
   */
  updateAssignment(id: number, body: UpdateAssignmentRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/assignments/${id}/update`, body);
  }

  /**
   * Удаляет тему.
   */
  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assignments/${id}`);
  }

  /**
   * Возвращает детальные данные задачи.
   */
  getTask(assignmentId: number, taskId: number): Observable<TaskDetailDto> {
    return this.http.get<TaskDetailDto>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}`);
  }

  /**
   * Создает новую задачу в теме.
   */
  createTask(assignmentId: number, body: CreateTaskRequest): Observable<TaskDetailDto> {
    return this.http.post<TaskDetailDto>(`${this.apiUrl}/assignments/${assignmentId}/tasks`, body);
  }

  /**
   * Обновляет задачу.
   */
  updateTask(assignmentId: number, taskId: number, body: CreateTaskRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}`, body);
  }

  /**
   * Удаляет задачу из темы.
   */
  deleteTask(assignmentId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}`);
  }

  /**
   * Возвращает детальные данные варианта задачи.
   */
  getVariant(assignmentId: number, taskId: number, variantId: number): Observable<VariantDetailDto> {
    return this.http.get<VariantDetailDto>(
      `${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/variants/${variantId}`,
    );
  }

  /**
   * Создает новый вариант задачи.
   */
  createVariant(assignmentId: number, taskId: number, body: CreateVariantRequest): Observable<VariantDetailDto> {
    return this.http.post<VariantDetailDto>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/variants`, body);
  }

  /**
   * Генерирует варианты задачи.
   */
  generateVariants(
    assignmentId: number,
    taskId: number,
    body: GenerateVariantsRequest,
  ): Observable<VariantDetailDto[]> {
    return this.http.post<VariantDetailDto[]>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/generate-variants`, body);
  }

  /**
   * Обновляет существующий вариант задачи.
   */
  updateVariant(assignmentId: number, taskId: number, variantId: number, body: UpdateVariantRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/variants/${variantId}`, body);
  }

  /**
   * Удаляет вариант задачи.
   */
  deleteVariant(assignmentId: number, taskId: number, variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/variants/${variantId}`);
  }

  /**
   * Возвращает открытые и закрытые тест-кейсы варианта.
   */
  getTaskTestCases(assignmentId: number, taskId: number, variantId: number): Observable<TaskTestCasesViewDto> {
    return this.http.get<TaskTestCasesViewDto>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/variants/${variantId}/test-cases`);
  }

  /**
   * Добавляет тест-кейс к варианту задачи.
   */
  addTaskTestCase(
    assignmentId: number,
    taskId: number,
    variantId: number,
    body: CreateTaskTestCaseRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/variants/${variantId}/test-cases`,
      body,
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Удаляет тест-кейс варианта задачи.
   */
  deleteTaskTestCase(assignmentId: number, taskId: number, variantId: number, testCaseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assignments/${assignmentId}/tasks/${taskId}/variants/${variantId}/test-cases/${testCaseId}`);
  }

  /**
   * Возвращает профиль текущего пользователя.
   */
  getMe(): Observable<CurrentUserDto> {
    return this.http.get<CurrentUserDto>(`${this.apiUrl}/me`);
  }

  /**
   * Создает новый тест.
   */
  createTest(body: CreateTestRequest): Observable<TestCreatedDto> {
    return this.http.post<TestCreatedDto>(`${this.apiUrl}/create-test`, body, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Возвращает список тестов преподавателя.
   */
  listMyTests(): Observable<TestListItemDto[]> {
    return this.http.get<TestListItemDto[]>(`${this.apiUrl}/tests/list`);
  }

  /**
   * Возвращает активные тесты студента.
   */
  getStudentCurrentTests(): Observable<StudentTestListItemDto[]> {
    return this.http.get<StudentTestListItemDto[]>(`${this.apiUrl}/student/tests/current`);
  }

  /**
   * Возвращает запланированные тесты студента.
   */
  getStudentUpcomingTests(): Observable<StudentTestListItemDto[]> {
    return this.http.get<StudentTestListItemDto[]>(`${this.apiUrl}/student/tests/upcoming`);
  }

  /**
   * Возвращает завершенные тесты студента.
   */
  getStudentCompletedTests(): Observable<StudentTestListItemDto[]> {
    return this.http.get<StudentTestListItemDto[]>(`${this.apiUrl}/student/tests/completed`);
  }

  /**
   * Отмечает тест завершенным.
   */
  completeStudentTest(testId: number, body?: { totalTimeSeconds?: number }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/student/tests/${testId}/complete`, body ?? {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Возвращает детальный обзор завершенного теста.
   */
  getStudentCompletedTestReview(testId: number): Observable<StudentCompletedTestReviewDto> {
    return this.http.get<StudentCompletedTestReviewDto>(`${this.apiUrl}/student/tests/${testId}/completed-review`);
  }

  /**
   * Возвращает детальные данные теста для прохождения.
   */
  getStudentTestDetail(id: number): Observable<StudentTestDetailDto> {
    return this.http.get<StudentTestDetailDto>(`${this.apiUrl}/student/tests/${id}`);
  }

  /**
   * Сохраняет ответ студента на вопрос теста.
   */
  saveStudentTestAnswer(
    testId: number,
    body: { testQuestionId: number; content: string; timeSpentSeconds?: number },
  ): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/student/tests/${testId}/answers`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Проверяет ответ студента и возвращает результат проверки.
   */
  checkStudentTestAnswer(testId: number, testQuestionId: number): Observable<TestAnswerCheckDto> {
    return this.http.post<TestAnswerCheckDto>(
      `${this.apiUrl}/student/tests/${testId}/answers/${testQuestionId}/check`,
      {},
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Возвращает ответы студентов по тесту преподавателя.
   */
  getTestSubmissions(testId: number): Observable<TestSubmissionsDto> {
    return this.http.get<TestSubmissionsDto>(`${this.apiUrl}/tests/${testId}/submissions`);
  }

  /**
   * Возвращает аналитику теста.
   */
  getTestAnalytics(testId: number): Observable<TestAnalyticsDto> {
    return this.http.get<TestAnalyticsDto>(`${this.apiUrl}/tests/${testId}/analytics`);
  }

  /**
   * Возвращает детальные данные теста.
   */
  getTest(id: number): Observable<TestDetailDto> {
    return this.http.get<TestDetailDto>(`${this.apiUrl}/tests/${id}`);
  }

  /**
   * Обновляет существующий тест.
   */
  updateTest(id: number, body: CreateTestRequest): Observable<TestCreatedDto> {
    return this.http.put<TestCreatedDto>(`${this.apiUrl}/tests/${id}`, body, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Удаляет тест.
   */
  deleteTest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tests/${id}`);
  }

  /**
   * Возвращает список групп преподавателя.
   */
  listTeacherGroups(): Observable<GroupSummaryDto[]> {
    return this.http.get<GroupSummaryDto[]>(`${this.apiUrl}/teacher/groups`);
  }

  /**
   * Возвращает участников выбранной группы.
   */
  listGroupMembers(groupId: number): Observable<GroupMemberDto[]> {
    return this.http.get<GroupMemberDto[]>(`${this.apiUrl}/teacher/groups/${groupId}/members`);
  }

  /**
   * Создает новую группу преподавателя.
   */
  createTeacherGroup(name: string): Observable<GroupSummaryDto> {
    return this.http.post<GroupSummaryDto>(`${this.apiUrl}/teacher/groups`, { name }, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Удаляет группу преподавателя.
   */
  deleteTeacherGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teacher/groups/${groupId}`);
  }

  /**
   * Удаляет участника из группы.
   */
  removeGroupMember(groupId: number, userId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/teacher/groups/remove-member`,
      { groupId, userId },
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
}

