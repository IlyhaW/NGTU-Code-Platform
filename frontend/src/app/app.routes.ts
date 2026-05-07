import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { StudentLayoutComponent } from './pages/student-layout/student-layout.component';
import { StudentSimplePageComponent } from './pages/student-simple-page/student-simple-page.component';
import { StudentCurrentTestsComponent } from './pages/student-current-tests/student-current-tests.component';
import { StudentTestTakeComponent } from './pages/student-test-take/student-test-take.component';
import { StudentCompletedTestsComponent } from './pages/student-completed-tests/student-completed-tests.component';
import { StudentCompletedTestReviewComponent } from './pages/student-completed-test-review/student-completed-test-review.component';
import { StudentUpcomingTestsComponent } from './pages/student-upcoming-tests/student-upcoming-tests.component';
import { TeacherDashboardComponent } from './pages/teacher-dashboard/teacher-dashboard.component';
import { TopicDetailComponent } from './pages/topic-detail/topic-detail.component';
import { TopicsTasksComponent } from './pages/topics-tasks/topics-tasks.component';
import { TaskDetailComponent } from './pages/task-detail/task-detail.component';
import { TaskTestCasesComponent } from './pages/task-test-cases/task-test-cases.component';
import { TaskGenerateVariantsComponent } from './pages/task-generate-variants/task-generate-variants.component';
import { TaskEditComponent } from './pages/task-edit/task-edit.component';
import { TestCreateComponent } from './pages/test-create/test-create.component';
import { TestSubmissionsComponent } from './pages/test-submissions/test-submissions.component';
import { TestAnalyticsComponent } from './pages/test-analytics/test-analytics.component';
import { TestAddTaskComponent } from './pages/test-add-task/test-add-task.component';
import { TestsSavedListComponent } from './pages/tests-saved-list/tests-saved-list.component';
import { TeacherGroupsComponent } from './pages/teacher-groups/teacher-groups.component';
import { studentGuard, teacherGuard } from './auth.guards';

/**
 * Маршруты клиентского приложения.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'teacher', component: TeacherDashboardComponent, canActivate: [teacherGuard] },
  {
    path: 'teacher/support',
    component: StudentSimplePageComponent,
    canActivate: [teacherGuard],
    data: {
      title: 'Техподдержка',
      subtitle: 'Раздел в разработке. Здесь будут ответы на частые вопросы и контакты поддержки.',
      backLink: '/teacher',
      backLabel: '← На главную',
    },
  },
  { path: 'teacher/groups', component: TeacherGroupsComponent, canActivate: [teacherGuard] },
  { path: 'teacher/topics', component: TopicsTasksComponent, canActivate: [teacherGuard] },
  { path: 'teacher/topics/new', component: TopicDetailComponent, data: { createTopic: true }, canActivate: [teacherGuard] },
  { path: 'teacher/topics/:id', component: TopicDetailComponent, canActivate: [teacherGuard] },
  { path: 'teacher/topics/:id/tasks/new', component: TaskEditComponent, canActivate: [teacherGuard] },
  { path: 'teacher/topics/:id/tasks/:taskId/generate-variants', component: TaskGenerateVariantsComponent, canActivate: [teacherGuard] },
  {
    path: 'teacher/topics/:id/tasks/:taskId/test-cases',
    component: TaskTestCasesComponent,
    canActivate: [teacherGuard],
  },
  {
    path: 'teacher/topics/:id/tasks/:taskId/variants/:variantId/test-cases',
    component: TaskTestCasesComponent,
    canActivate: [teacherGuard],
  },
  { path: 'teacher/topics/:id/tasks/:taskId/variants/:variantId', component: TaskDetailComponent, canActivate: [teacherGuard] },
  { path: 'teacher/topics/:id/tasks/:taskId', component: TaskDetailComponent, canActivate: [teacherGuard] },
  { path: 'teacher/analytics', component: TestsSavedListComponent, data: { testsListMode: 'analytics' }, canActivate: [teacherGuard] },
  { path: 'teacher/tests/saved', component: TestsSavedListComponent, data: { testsListMode: 'saved' }, canActivate: [teacherGuard] },
  { path: 'teacher/tests/new/add-task', component: TestAddTaskComponent, canActivate: [teacherGuard] },
  { path: 'teacher/tests/new', component: TestCreateComponent, canActivate: [teacherGuard] },
  { path: 'teacher/tests/:testId/edit/add-task', component: TestAddTaskComponent, canActivate: [teacherGuard] },
  { path: 'teacher/tests/:testId/analytics', component: TestAnalyticsComponent, canActivate: [teacherGuard] },
  { path: 'teacher/tests/:testId/submissions', component: TestSubmissionsComponent, canActivate: [teacherGuard] },
  { path: 'teacher/tests/:testId/edit', component: TestCreateComponent, canActivate: [teacherGuard] },
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [studentGuard],
    children: [
      { path: '', pathMatch: 'full', component: StudentDashboardComponent },
      { path: 'tests/current', component: StudentCurrentTestsComponent },
      { path: 'tests/completed/:testId', component: StudentCompletedTestReviewComponent },
      { path: 'tests/completed', component: StudentCompletedTestsComponent },
      { path: 'tests/upcoming', component: StudentUpcomingTestsComponent },
      { path: 'tests/:testId', component: StudentTestTakeComponent },
      {
        path: 'support',
        component: StudentSimplePageComponent,
        data: {
          title: 'ТехПоддержка',
          subtitle: 'Раздел в разработке. Здесь будут ответы на частые вопросы и контакты поддержки.',
        },
      },
    ],
  },
];

