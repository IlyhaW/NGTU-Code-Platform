import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TestCreateDraftService } from '../../services/test-create-draft.service';
import { AssignmentDetailDto, AssignmentDto } from '../../api.types';

@Component({
  selector: 'app-test-add-task',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="add-task-layout">
      <header class="add-task-header">
        <div class="add-task-header__left">
          <button type="button" class="add-task-header__back" (click)="goBack()" aria-label="Назад">←</button>
          <div class="add-task-header__title-box">
            <h1 class="add-task-header__title">Добавить задачу в тест</h1>
          </div>
        </div>

        <a routerLink="/teacher" class="add-task-header__back add-task-header__back--right" aria-label="На главную">⌂</a>
      </header>

      <div class="add-task-msg add-task-msg--error" *ngIf="pageError">{{ pageError }}</div>

      <div class="add-task-loading" *ngIf="pageLoading">Загрузка…</div>

      <main class="add-task-main" *ngIf="!pageLoading">
        <div class="add-task-grid">
          <div class="add-task-left">
            <h2 class="add-task-task-title">Задача {{ draft.selectedTasks.length + 1 }}</h2>

            <div class="add-task-left__body">
              <label class="add-task-field">
                <span class="add-task-field__label">Тема</span>
                <select
                  class="add-task-field__select"
                  [(ngModel)]="assignmentId"
                  (ngModelChange)="onThemeChange($event)"
                >
                  <option [ngValue]="null">Выберите тему…</option>
                  <option *ngFor="let a of assignments" [ngValue]="a.id">{{ a.name }}</option>
                </select>
              </label>

              <label class="add-task-field">
                <span class="add-task-field__label">Индивидуальные варианты</span>
                <select class="add-task-field__select" [(ngModel)]="individualVariants">
                  <option [ngValue]="false">Нет</option>
                  <option [ngValue]="true">Да</option>
                </select>
              </label>
              <p class="add-task-muted add-task-muted--narrow" *ngIf="individualVariants">
                Каждому студенту из групп теста будет назначен свой вариант этой задачи. Сохранить тест с этим
                флагом можно только если число студентов не больше минимума вариантов среди всех заданий с «Да» (и
                у каждой такой задачи есть достаточно вариантов).
              </p>

              <label class="add-task-field">
                <span class="add-task-field__label">Ограничение по времени в минутах</span>
                <input
                  type="number"
                  class="add-task-field__input"
                  [(ngModel)]="solveStr"
                  min="1"
                  placeholder="оставьте пустым — без лимита"
                />
              </label>

              <label class="add-task-field">
                <span class="add-task-field__label">Количество попыток</span>
                <input type="number" class="add-task-field__input" [(ngModel)]="attemptsStr" min="1" />
              </label>

              <div class="add-task-err" *ngIf="formError">{{ formError }}</div>
            </div>

            <div class="add-task-save-row">
              <button type="button" class="add-task-save add-task-btn add-task-btn--primary" (click)="save()">
                Сохранить
              </button>
            </div>
          </div>

          <div class="add-task-right">
            <h3 class="add-task-right__title">Задачи по теме</h3>
            <p class="add-task-right__hint" *ngIf="assignmentId == null">Выберите тему слева.</p>
            <div class="add-task-right__loading" *ngIf="assignmentId != null && detailLoading">Загрузка…</div>
            <section class="add-task-right__board" *ngIf="assignmentDetail && !detailLoading">
              <div class="add-task-tags" *ngIf="assignmentDetail.tags?.length">
                <span *ngFor="let tag of assignmentDetail.tags" class="add-task-tag">{{ tag }}</span>
              </div>
              <p class="add-task-muted" *ngIf="!assignmentDetail.tags?.length">У темы пока нет тегов.</p>
              <ul class="add-task-list">
                <li *ngFor="let task of assignmentDetail.tasks">
                  <button
                    type="button"
                    class="add-task-pick"
                    [class.add-task-pick--active]="selectedTaskId === task.id"
                    (click)="selectTask(task.id)"
                  >
                    <span class="add-task-pick__name">{{ task.name }}</span>
                    <span class="add-task-pick__meta" *ngIf="task.variantsCount != null"
                      >{{ task.variantsCount }} вариантов</span
                    >
                    <span class="add-task-pick__tags" *ngIf="task.tags?.length">
                      <span *ngFor="let tag of task.tags" class="add-task-tag">{{ tag }}</span>
                    </span>
                  </button>
                </li>
              </ul>
              <p class="add-task-muted" *ngIf="!assignmentDetail.tasks?.length">В теме нет задач.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .add-task-layout {
        box-sizing: border-box;
        height: 100vh;
        height: 100dvh;
        padding: 0.9em 1.35em 0.9em;
        font-size: clamp(16px, 0.65vw + 12px, 24px);
        line-height: 1.45;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .add-task-header {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.65em;
        gap: 0.85em;
        flex-wrap: wrap;
      }

      .add-task-header__left {
        display: flex;
        align-items: center;
        gap: 0.6em;
        flex: 1 1 auto;
        min-width: 0;
      }

      .add-task-header__back {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.75em;
        height: 2.75em;
        border-radius: 0.55em;
        background: #fff;
        border: 1px solid #d1d5e6;
        color: #374151;
        text-decoration: none;
        font-size: 1.35em;
        font-weight: 600;
        line-height: 1;
        flex-shrink: 0;
        padding: 0;
        cursor: pointer;
        font-family: inherit;
      }
      .add-task-header__back--right { margin-left: auto; }

      .add-task-header__back:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }

      .add-task-header__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.55em 0.9em;
        min-width: 0;
      }

      .add-task-header__title {
        margin: 0;
        font-size: 1.15em;
        font-weight: 600;
        color: #111827;
      }

      .add-task-header__user-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 2.5em;
        flex-shrink: 0;
      }

      .add-task-header__avatar {
        width: 2.5em;
        height: 2.5em;
        border-radius: 999px;
        border: 1px solid #cbd0e2;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
      }

      .add-task-header__avatar-img {
        width: 1.35em;
        height: 1.35em;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5b6b8a;
      }
      .add-task-header__avatar-img svg {
        width: 100%;
        height: 100%;
      }

      .add-task-header__menu {
        position: absolute;
        top: calc(100% + 0.35em);
        right: 0;
        background: #ffffff;
        border-radius: 0.55em;
        border: 1px solid #94a3b8;
        box-shadow: 0 0.45em 1em rgba(15, 23, 42, 0.2);
        padding: 0.55em 0.65em;
        min-width: 10em;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 0.35em;
      }

      .add-task-header__menu-name {
        font-size: 0.95em;
        font-weight: 600;
        color: #0f172a;
      }

      .add-task-header__menu-role {
        font-size: 0.85em;
        color: #475569;
      }

      .add-task-header__menu-item {
        padding: 0.45em 0.6em;
        border-radius: 0.45em;
        border: 0;
        background: #e2e8f0;
        color: #1e293b;
        cursor: pointer;
        font-size: 0.95em;
        font-weight: 500;
        text-align: left;
      }

      .add-task-header__menu-item:hover {
        background: #cbd5e1;
        color: #0f172a;
      }

      .add-task-msg {
        margin: 0 0 0.75em;
        padding: 0.55em 0.75em;
        border-radius: 0.45em;
        font-size: 0.95em;
      }

      .add-task-msg--error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .add-task-loading {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
      }

      .add-task-main {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .add-task-grid {
        flex: 1;
        height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 0.75em;
        align-items: stretch;
        min-height: 0;
      }

      .add-task-left {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.85em 1em;
        display: flex;
        flex-direction: column;
        gap: 0.6em;
        min-height: 0;
      }

      .add-task-left__body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0.85em;
      }

      .add-task-save-row {
        margin-top: auto;
        padding-top: 0.6em;
      }

      .add-task-task-title {
        margin: 0;
        text-align: center;
        font-size: 1.1em;
        font-weight: 700;
        color: #111827;
      }

      .add-task-field {
        display: flex;
        flex-direction: column;
        gap: 0.35em;
        flex: 0 0 auto;
      }

      .add-task-field__label {
        font-size: 0.88em;
        font-weight: 600;
        color: #334155;
      }

      .add-task-field__select,
      .add-task-field__input {
        width: 100%;
        padding: 0.98em 0.92em;
        border: 1px solid #cbd5e1;
        border-radius: 0.5em;
        font-size: 0.95em;
        font-family: inherit;
        background: #fff;
        box-sizing: border-box;
        min-height: 3.7em;
      }

      .add-task-field__select {
        cursor: pointer;
      }

      .add-task-btn {
        padding: 0.55em 0.85em;
        border-radius: 0.5em;
        border: 0;
        font-size: 0.95em;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
      }

      .add-task-btn--primary {
        background: #a5c8ff;
        color: #1e3a5f;
      }

      .add-task-btn--primary:hover {
        background: #8bb8ff;
      }

      .add-task-save {
        margin-top: 0.35em;
        width: 100%;
        padding: 0.65em 1em;
        border-radius: 0.55em;
      }

      .add-task-err {
        font-size: 0.88em;
        color: #b91c1c;
      }

      .add-task-right {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.85em 1em;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0.55em;
        overflow: hidden;
      }

      .add-task-right__board {
        flex: 1 1 auto;
        min-height: 0;
        height: 0;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        background: #ffffff;
        padding: 0.75em;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 0.55em;
        overflow: hidden;
      }

      .add-task-right__title {
        margin: 0;
        font-size: 1em;
        font-weight: 600;
        color: #111827;
      }

      .add-task-right__hint,
      .add-task-right__loading,
      .add-task-muted {
        margin: 0;
        font-size: 0.88em;
        color: #64748b;
      }

      .add-task-muted--narrow {
        margin: -0.15rem 0 0.65rem;
        line-height: 1.4;
        max-width: 52ch;
      }

      .add-task-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4em;
      }

      .add-task-tag {
        display: inline-block;
        padding: 0.25em 0.5em;
        border-radius: 0.45em;
        background: #c8e6c9;
        color: #1b5e20;
        font-size: 0.85em;
      }

      .add-task-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45em;
        overflow-y: auto;
        flex: 1;
        height: 0;
        min-height: 0;
      }

      .add-task-pick {
        width: 100%;
        text-align: left;
        padding: 0.55em 0.65em;
        border-radius: 0.5em;
        border: 1px solid #d1d5e6;
        background: #fafbfe;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.92em;
        display: flex;
        flex-direction: column;
        gap: 0.15em;
        align-items: flex-start;
      }

      .add-task-pick:hover {
        border-color: #94a3b8;
        background: #f1f5f9;
      }

      .add-task-pick--active {
        border-color: #5b7cff;
        background: #eef2ff;
        box-shadow: 0 0 0 1px rgba(91, 124, 255, 0.35);
      }

      .add-task-pick__name {
        font-weight: 600;
        color: #0f172a;
      }

      .add-task-pick__meta {
        font-size: 0.82em;
        color: #64748b;
      }

      .add-task-pick__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35em;
        margin-top: 0.2em;
      }

      @media (max-width: 768px) {
        .add-task-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .add-task-header {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
/**
 * Компонент добавления задач в тест.
 */
export class TestAddTaskComponent implements OnInit {
  assignments: AssignmentDto[] = [];
  assignmentId: number | null = null;
  assignmentDetail: AssignmentDetailDto | null = null;
  detailLoading = false;
  selectedTaskId: number | null = null;
  individualVariants = false;
  solveStr = '45';
  attemptsStr = '5';
  formError = '';

  pageLoading = true;
  pageError = '';
  userMenuOpen = false;
  userDisplayName = 'Преподаватель';
  userRoleLabel = 'Преподаватель';

  /**
   * Маршрут возврата к форме создания или редактирования теста.
   */
  backToTestPath = '/teacher/tests/new';

  constructor(
    private readonly auth: AuthService,
    readonly draft: TestCreateDraftService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  /**
   * Инициализирует страницу и загружает доступные темы.
   */
  ngOnInit(): void {
    const tid = this.route.snapshot.paramMap.get('testId');
    if (tid) {
      this.backToTestPath = `/teacher/tests/${tid}/edit`;
    }
    this.auth.getMe().subscribe({
      next: (user) => {
        this.userDisplayName = user.fullName?.trim() || 'Преподаватель';
        this.userRoleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Студент';
        if (user.role !== 'teacher') {
          this.router.navigateByUrl('/login');
        }
      },
      error: () => this.router.navigateByUrl('/login'),
    });

    this.auth.getAssignments().subscribe({
      next: (list) => {
        this.assignments = list;
        this.pageLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.assignments = [];
        this.pageLoading = false;
        if (err.status === 401) this.router.navigateByUrl('/login');
        else this.pageError = 'Не удалось загрузить темы.';
      },
    });
  }

  /**
   * Загружает детали выбранной темы.
   */
  onThemeChange(id: number | null): void {
    this.assignmentDetail = null;
    this.selectedTaskId = null;
    this.formError = '';
    if (id == null) {
      this.detailLoading = false;
      return;
    }
    this.detailLoading = true;
    this.auth.getAssignment(id).subscribe({
      next: (detail) => {
        this.assignmentDetail = detail;
        this.detailLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.assignmentDetail = null;
        this.detailLoading = false;
        if (err.status === 401) this.router.navigateByUrl('/login');
        else this.formError = 'Не удалось загрузить тему.';
      },
    });
  }

  /**
   * Выбирает задачу из списка задач темы.
   */
  selectTask(taskId: number): void {
    this.selectedTaskId = taskId;
    this.formError = '';
  }

  /**
   * Валидирует форму и добавляет выбранную задачу в черновик теста.
   */
  save(): void {
    this.formError = '';
    if (this.assignmentId == null) {
      this.formError = 'Выберите тему.';
      return;
    }
    if (this.selectedTaskId == null) {
      this.formError = 'Выберите задачу из списка справа.';
      return;
    }
    const detail = this.assignmentDetail;
    if (!detail) {
      this.formError = 'Дождитесь загрузки темы.';
      return;
    }
    const task = detail.tasks.find((t) => t.id === this.selectedTaskId);
    if (!task) {
      this.formError = 'Задача не найдена.';
      return;
    }

    const attempts = Number(this.attemptsStr);
    if (!Number.isFinite(attempts) || attempts < 1) {
      this.formError = 'Укажите число попыток не меньше 1.';
      return;
    }

    let solveTimeMinutes: number | null = null;
    const tStr = this.solveStr.trim();
    if (tStr !== '') {
      const m = Number(tStr);
      if (!Number.isFinite(m) || m < 1) {
        this.formError = 'Лимит времени — положительное число минут или пусто.';
        return;
      }
      solveTimeMinutes = Math.round(m);
    }

    const dup = this.draft.selectedTasks.some(
      (x) => x.assignmentId === this.assignmentId && x.assignmentTaskId === this.selectedTaskId,
    );
    if (dup) {
      this.formError = 'Эта задача уже добавлена в тест.';
      return;
    }

    this.draft.selectedTasks.push({
      assignmentId: this.assignmentId,
      assignmentTaskId: this.selectedTaskId,
      assignmentName: detail.name,
      taskName: task.name,
      maxAttempts: Math.round(attempts),
      solveTimeMinutes,
      individualVariants: this.individualVariants,
    });
    const editId = this.route.snapshot.paramMap.get('testId');
    if (editId) {
      this.draft.skipNextEditReload = true;
    }
    void this.router.navigateByUrl(this.backToTestPath);
  }

  /**
   * Переключает отображение пользовательского меню.
   */
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  /**
   * Возвращает пользователя на страницу формы теста.
   */
  goBack(): void {
    void this.router.navigateByUrl(this.backToTestPath);
  }

  /**
   * Выполняет выход пользователя из системы.
   */
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
  }
}
