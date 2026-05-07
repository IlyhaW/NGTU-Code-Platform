import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AssignmentDetailDto, AssignmentTaskDto } from '../../api.types';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="topic-detail-layout">
      <header class="topic-detail-header">
        <div class="topic-detail-header__left">
          <button type="button" class="topic-detail-header__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="topic-detail-header__title-box" *ngIf="topic || loading">
            <h1
              *ngIf="topic && !editingTopicName"
              class="topic-detail-header__title topic-detail-header__title--editable"
              (click)="startEditTopicName()"
              title="Нажмите, чтобы изменить название"
            >{{ topic.name || 'Тема' }}</h1>
            <input
              *ngIf="topic && editingTopicName"
              type="text"
              class="topic-detail-header__title-input"
              [(ngModel)]="topic.name"
              (blur)="finishEditTopicName()"
              (keyup.enter)="finishEditTopicName()"
              (click)="$event.stopPropagation()"
              #topicNameField
            />
            <h1 *ngIf="!topic && loading" class="topic-detail-header__title">Тема</h1>
          </div>
        </div>
        <a routerLink="/teacher" class="topic-detail-header__home topic-detail-header__home--right" aria-label="На главную">⌂</a>
      </header>

      <main class="topic-detail-main">
        <div class="topic-detail-head">
          <div class="topic-detail-tags-row">
            <span *ngFor="let tag of displayTags; let i = index" class="topic-detail-tag">
              {{ tag }}
              <button type="button" class="topic-detail-tag__remove" (click)="removeTag(i)" aria-label="Удалить тег">×</button>
            </span>
            <input
              *ngIf="showNewTagInput"
              type="text"
              class="topic-detail-tag-input"
              [(ngModel)]="newTagValue"
              (keyup.enter)="confirmNewTag()"
              (blur)="confirmNewTag()"
              placeholder="Новый тег"
              autofocus
            />
            <button type="button" class="topic-detail-add-tag" (click)="addTag()" aria-label="Добавить тег" title="Добавить тег">
              <span class="topic-detail-add-tag__icon">+</span>
            </button>
          </div>
        </div>

        <div class="topic-detail-body">
          <input
            type="text"
            class="topic-detail-tasks__search topic-detail-tasks__search--outside"
            placeholder="Поиск по задачам..."
            [(ngModel)]="taskSearchQuery"
          />

          <section class="topic-detail-tasks">
            <h3 class="topic-detail-tasks__title">Список задач</h3>
            <div class="topic-detail-tasks__list">
              <div *ngFor="let task of filteredTasks" class="topic-detail-task-row">
                <a
                  [routerLink]="['/teacher/topics', topicId, 'tasks', task.id]"
                  class="topic-detail-task topic-detail-task--link"
                  title="Открыть задачу и варианты"
                >
                  <span class="topic-detail-task__name">{{ task.name }}</span>
                  <div class="topic-detail-task__tags" *ngIf="(task.tags || []).length > 0">
                    <span class="topic-detail-task__tag" *ngFor="let tag of task.tags">{{ tag }}</span>
                  </div>
                </a>
                <button type="button" class="topic-detail-task__remove" (click)="removeTask($event, task)" aria-label="Удалить">×</button>
              </div>
            </div>
            <button type="button" class="topic-detail-tasks__add" (click)="addTask()">Добавить новую задачу</button>
          </section>

          <div class="topic-detail-actions">
            <button type="button" class="topic-detail-btn topic-detail-btn--save" (click)="save()" [disabled]="saving">Сохранить изменения</button>
            <button *ngIf="!isCreating" type="button" class="topic-detail-btn topic-detail-btn--delete" (click)="deleteTopic()" [disabled]="saving">Удалить тему</button>
          </div>
        </div>

        <div *ngIf="loading" class="topic-detail-loading">Загрузка...</div>
        <div *ngIf="error" class="topic-detail-error">{{ error }}</div>
        <div *ngIf="success" class="topic-detail-success">Сохранено</div>
      </main>
    </div>
  `,
  styles: [`
    /* Базовый layout страницы темы. */
    .topic-detail-layout {
      box-sizing: border-box;
      height: 100vh;
      height: 100dvh;
      min-height: 100vh;
      min-height: 100dvh;
      padding: 0.95em 1.35em 1.15em;
      font-size: clamp(16px, 0.65vw + 12px, 24px);
      line-height: 1.45;
      background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .topic-detail-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75em;
      gap: 0.85em;
      flex-wrap: wrap;
    }
    .topic-detail-header__left { display: flex; align-items: center; gap: 0.6em; }
    .topic-detail-header__home {
      display: flex; align-items: center; justify-content: center;
      width: 2.75em; height: 2.75em; border-radius: 0.55em;
      background: #fff; border: 1px solid #d1d5e6; color: #374151;
      text-decoration: none; font-size: 1.15em; flex-shrink: 0;
      padding: 0; cursor: pointer; font-family: inherit;
    }
    .topic-detail-header__home--right { margin-left: auto; }
    .topic-detail-header__home:hover { background: #f5f6fb; border-color: #b2b9ee; }
    .topic-detail-header__title-box {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.55em;
      padding: 0.55em 0.9em; min-width: min(12em, 40vw);
      max-width: min(56em, 96vw);
    }
    .topic-detail-header__title { margin: 0; font-size: 1.2em; font-weight: 600; color: #111827; }
    .topic-detail-header__title--editable { cursor: pointer; }
    .topic-detail-header__title--editable:hover { color: #1d4ed8; }
    .topic-detail-header__title-input {
      width: 100%; min-width: 0; margin: 0; padding: 0; border: 0; outline: none;
      font-size: 1.2em; font-weight: 600; color: #111827; background: transparent;
      font-family: inherit;
    }
    .topic-detail-header__user-wrapper { position: relative; display: flex; align-items: center; justify-content: flex-end; min-width: 2.5em; }
    .topic-detail-header__avatar {
      width: 2.5em; height: 2.5em; border-radius: 999px; border: 1px solid #cbd0e2; background: #fff;
      display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;
    }
    .topic-detail-header__avatar-img { width: 1.35em; height: 1.35em; color: #5b6b8a; }
    .topic-detail-header__avatar-img svg { width: 100%; height: 100%; }
    .topic-detail-header__menu {
      position: absolute; top: calc(100% + 0.35em); right: 0; background: #fff; border-radius: 0.55em; border: 1px solid #94a3b8;
      box-shadow: 0 0.45em 1em rgba(15, 23, 42, 0.2); padding: 0.55em 0.65em; min-width: 10em; z-index: 10;
      display: flex; flex-direction: column; gap: 0.35em;
    }
    .topic-detail-header__menu-name { font-size: 0.95em; font-weight: 600; color: #0f172a; }
    .topic-detail-header__menu-role { font-size: 0.85em; color: #475569; margin-bottom: 0.35em; }
    .topic-detail-header__menu-item {
      padding: 0.45em 0.6em; border-radius: 0.45em; border: 0; background: #e2e8f0; color: #1e293b;
      cursor: pointer; font-size: 0.95em; font-weight: 500; text-align: left;
    }
    .topic-detail-header__menu-item:hover { background: #cbd5e1; }

    .topic-detail-main {
      width: 100%; max-width: none; box-sizing: border-box;
      flex: 1 1 auto; min-height: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .topic-detail-head { flex-shrink: 0; margin-bottom: 0.7em; }
    .topic-detail-tags-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.45em;
    }
    .topic-detail-tag {
      display: inline-flex; align-items: center; gap: 0.2em;
      padding: 0.25em 0.5em; border-radius: 0.45em; background: #c8e6c9; color: #1b5e20; font-size: 0.9em;
    }
    .topic-detail-tag__remove {
      padding: 0; margin: 0; border: 0; background: none; cursor: pointer; font-size: 1em; line-height: 1; color: #1b5e20; opacity: 0.8;
    }
    .topic-detail-tag__remove:hover { opacity: 1; }
    .topic-detail-tag-input {
      min-width: 8em; flex: 1; max-width: 16em; padding: 0.35em 0.5em; font-size: 0.95em; border: 1px solid #94a3b8; border-radius: 0.45em;
    }
    .topic-detail-add-tag {
      width: 1.75em; height: 1.75em; border-radius: 50%; border: 1px solid #94a3b8; background: #fff;
      display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; flex-shrink: 0;
    }
    .topic-detail-add-tag:hover { background: #f1f5f9; border-color: #64748b; }
    .topic-detail-add-tag__icon { font-size: 1.1em; font-weight: 300; line-height: 1; color: #475569; }

    .topic-detail-body {
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .topic-detail-tasks__search--outside {
      flex-shrink: 0;
      margin: 0 0 0.55em;
    }
    .topic-detail-tasks {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 0.78em 0.95em 0.72em 0.95em;
      width: 100%; box-sizing: border-box;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
    }
    .topic-detail-tasks__title { flex-shrink: 0; margin: 0 0 0.5em; font-size: 1.05em; font-weight: 600; color: #111827; }
    .topic-detail-tasks__search {
      flex-shrink: 0;
      width: 100%; padding: 0.56em 0.78em; margin-bottom: 0.5em; font-size: 0.96em; border: 1px solid #d1d5e6; border-radius: 0.55em;
      box-sizing: border-box;
    }
    .topic-detail-tasks__list {
      flex: 1 1 auto;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      margin-bottom: 0.5em;
      border: 1px solid #e2e8f0;
      border-radius: 0.45em;
      background: #ffffff;
      -webkit-overflow-scrolling: touch;
    }
    .topic-detail-task-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.35em 0.75em;
      width: 100%;
      box-sizing: border-box;
      border-bottom: 1px solid #e5e7eb;
      padding: 0.1em 0.35em 0.1em 0.45em;
    }
    .topic-detail-task-row:last-child { border-bottom: none; }
    .topic-detail-task-row:hover { background: #f8fafc; }
    .topic-detail-task {
      display: block;
      min-width: 0;
      padding: 0.55em 0.25em 0.55em 0.15em;
      text-decoration: none; color: inherit;
    }
    .topic-detail-task__name {
      display: block; font-size: 1em; color: #374151;
      word-wrap: break-word; overflow-wrap: break-word;
    }
    .topic-detail-task__tags {
      margin-top: 0.35em;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.45em;
    }
    /* Тег задачи в списке задач темы. */
    .topic-detail-task__tag {
      display: inline-flex;
      align-items: center;
      gap: 0.2em;
      padding: 0.25em 0.5em;
      border-radius: 0.45em;
      background: #c8e6c9;
      color: #1b5e20;
      font-size: 0.9em;
    }
    .topic-detail-task__remove {
      justify-self: end; align-self: center;
      width: 2em; height: 2em; padding: 0; margin: 0;
      border: 0; border-radius: 0.35em;
      background: transparent; cursor: pointer; font-size: 1.25em; line-height: 1;
      color: #dc2626; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .topic-detail-task__remove:hover { color: #b91c1c; background: rgba(220, 38, 38, 0.1); }
    .topic-detail-tasks__add {
      flex-shrink: 0;
      display: block;
      margin-top: 0;
      padding: 0.58em 0.9em; border-radius: 0.55em; border: 0; background: #a5c8ff; color: #1e3a5f;
      cursor: pointer; font-size: 1em; font-weight: 500; width: 100%; box-sizing: border-box;
    }
    .topic-detail-tasks__add:hover { background: #8bb8ff; }

    .topic-detail-actions {
      flex-shrink: 0;
      display: flex; flex-direction: row; gap: 0.65em;
      margin-top: 0.85em; padding: 0; width: 100%; box-sizing: border-box;
      background: transparent; border: none;
    }
    .topic-detail-btn {
      padding: 0.58em 0.9em; border-radius: 0.55em; border: 0; cursor: pointer; font-size: 1em; font-weight: 500; width: 50%;
      flex: 1 1 0;
    }
    .topic-detail-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .topic-detail-btn--save { background: #a5c8ff; color: #1e3a5f; }
    .topic-detail-btn--save:hover:not(:disabled) { background: #8bb8ff; }
    .topic-detail-btn--delete { background: #fecaca; color: #991b1b; }
    .topic-detail-btn--delete:hover:not(:disabled) { background: #fca5a5; }

    .topic-detail-loading, .topic-detail-error, .topic-detail-success {
      flex-shrink: 0;
      padding: 1em; text-align: center; font-size: 1em;
    }
    .topic-detail-loading, .topic-detail-success { color: #6b7280; }
    .topic-detail-error { color: #b91c1c; }
    .topic-detail-success { color: #15803d; }
  `],
})
/**
 * Компонент просмотра и редактирования темы.
 */
export class TopicDetailComponent implements OnInit {
  @ViewChild('topicNameField') topicNameField?: ElementRef<HTMLInputElement>;

  topic: AssignmentDetailDto | null = null;
  displayTags: string[] = [];
  displayTasks: AssignmentTaskDto[] = [];
  taskSearchQuery = '';
  showNewTagInput = false;
  newTagValue = '';
  editingTopicName = false;
  loading = true;
  error = '';
  success = '';
  saving = false;
  userMenuOpen = false;
  userDisplayName = 'Преподаватель';
  userRoleLabel = 'Преподаватель';
  topicId: number | null = null;
  isCreating = false;

  /**
   * Возвращает список задач с учетом поискового фильтра.
   */
  get filteredTasks(): AssignmentTaskDto[] {
    const q = (this.taskSearchQuery || '').trim().toLowerCase();
    if (!q) return this.displayTasks;
    return this.displayTasks.filter(t => {
      const nameMatch = (t.name || '').toLowerCase().includes(q);
      const tagMatch = (t.tags || []).some(tag => (tag || '').toLowerCase().includes(q));
      return nameMatch || tagMatch;
    });
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  /**
   * Инициализирует страницу создания или редактирования темы.
   */
  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => {
        this.userDisplayName = user.fullName?.trim() || 'Преподаватель';
        this.userRoleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Студент';
      },
      error: () => {},
    });
    const isCreateRoute = this.route.snapshot.data['createTopic'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (isCreateRoute || id === 'new') {
      this.isCreating = true;
      this.topic = {
        id: 0,
        name: '',
        teacherId: 0,
        tags: [],
        tasks: [],
      };
      this.displayTags = [];
      this.displayTasks = [];
      this.loading = false;
      this.editingTopicName = true;
      setTimeout(() => this.topicNameField?.nativeElement?.focus(), 0);
    } else if (id) {
      this.topicId = +id;
      this.loadTopic();
    } else {
      this.loading = false;
      this.error = 'Не указана тема';
    }
  }

  /**
   * Загружает тему с сервера по идентификатору.
   */
  private loadTopic(): void {
    if (this.topicId == null) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    this.auth.getAssignment(this.topicId).subscribe({
      next: (t) => {
        this.topic = t;
        this.displayTags = [...(t.tags || [])];
        this.displayTasks = [...(t.tasks || [])];
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.topic = null;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = err?.status === 404 ? 'Тема не найдена' : 'Ошибка загрузки';
      },
    });
  }

  /**
   * Переключает отображение пользовательского меню.
   */
  toggleUserMenu(): void { this.userMenuOpen = !this.userMenuOpen; }
  /**
   * Возвращает пользователя к списку тем.
   */
  goBack(): void { void this.router.navigateByUrl('/teacher/topics'); }
  /**
   * Выполняет выход пользователя из системы.
   */
  logout(): void { localStorage.removeItem('token'); this.router.navigateByUrl('/login'); }

  /**
   * Переводит заголовок темы в режим редактирования.
   */
  startEditTopicName(): void {
    if (!this.topic) return;
    this.editingTopicName = true;
    setTimeout(() => this.topicNameField?.nativeElement?.focus(), 0);
  }

  /**
   * Завершает редактирование заголовка темы.
   */
  finishEditTopicName(): void {
    this.editingTopicName = false;
    if (this.topic?.name) {
      const t = this.topic.name.trim();
      this.topic.name = t || 'Тема';
    }
  }

  /**
   * Удаляет тег темы по индексу.
   */
  removeTag(i: number): void { this.displayTags.splice(i, 1); }

  /**
   * Открывает поле добавления нового тега.
   */
  addTag(): void {
    this.showNewTagInput = true;
    this.newTagValue = '';
  }

  /**
   * Подтверждает и добавляет новый тег.
   */
  confirmNewTag(): void {
    const v = (this.newTagValue || '').trim();
    this.showNewTagInput = false;
    this.newTagValue = '';
    if (v && !this.displayTags.includes(v)) this.displayTags.push(v);
  }

  /**
   * Удаляет задачу из темы.
   */
  removeTask(event: Event, task: AssignmentTaskDto): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.topicId) return;
    this.saving = true;
    this.error = '';
    this.auth.deleteTask(this.topicId, task.id).subscribe({
      next: () => {
        this.displayTasks = this.displayTasks.filter(t => t.id !== task.id);
        this.saving = false;
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = err?.status === 404 ? 'Задача не найдена' : 'Ошибка удаления';
      },
    });
  }

  /**
   * Переходит на страницу создания новой задачи.
   */
  addTask(): void {
    if (this.topicId != null) this.router.navigate(['/teacher/topics', this.topicId, 'tasks', 'new']);
  }

  /**
   * Сохраняет тему: создает новую или обновляет существующую.
   */
  save(): void {
    if (!this.topic) return;
    this.saving = true;
    this.error = '';
    this.success = '';
    const payload = { name: (this.topic.name || '').trim() || 'Новая тема', tags: this.displayTags };
    if (this.isCreating || this.topicId == null) {
      this.auth.createAssignment(payload).subscribe({
        next: (created) => {
          this.saving = false;
          this.success = 'Сохранено';
          this.isCreating = false;
          this.topicId = created.id;
          this.topic = created;
          this.displayTags = [...(created.tags || [])];
          this.displayTasks = [...(created.tasks || [])];
          void this.router.navigateByUrl(`/teacher/topics/${created.id}`);
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          if (err?.status === 401) this.router.navigateByUrl('/login');
          else this.error = 'Ошибка создания темы';
        },
      });
      return;
    }
    this.auth.updateAssignment(this.topicId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Сохранено';
        setTimeout(() => { this.success = ''; }, 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = err?.status === 404 ? 'Тема не найдена' : 'Ошибка сохранения';
      },
    });
  }

  /**
   * Удаляет текущую тему.
   */
  deleteTopic(): void {
    if (this.topicId == null || !confirm('Удалить тему?')) return;
    this.saving = true;
    this.error = '';
    this.auth.deleteAssignment(this.topicId).subscribe({
      next: () => this.router.navigateByUrl('/teacher/topics'),
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = err?.status === 404 ? 'Тема не найдена' : 'Ошибка удаления';
      },
    });
  }
}
