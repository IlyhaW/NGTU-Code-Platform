import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AssignmentDetailDto, VariantDetailDto } from '../../api.types';

/**
 * Компонент создания и редактирования задачи.
 */
@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="task-detail-layout">
      <header class="task-detail-header">
        <div class="task-detail-header__left">
          <button type="button" class="task-detail-header__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="task-detail-header__grow">
            <div class="task-detail-header__title-box">
              <input
                type="text"
                class="task-detail-header__title-input"
                [(ngModel)]="taskTitle"
                placeholder="Название задачи"
              />
            </div>
            <div class="task-detail-tags-row">
              <span *ngFor="let tag of displayTags; let i = index" class="task-detail-tag">
                {{ tag }}
                <button type="button" class="task-detail-tag__remove" (click)="removeTag(i)" aria-label="Удалить тег">×</button>
              </span>
              <input
                *ngIf="showNewTagInput"
                type="text"
                class="task-detail-tag-input"
                [(ngModel)]="newTagValue"
                (keyup.enter)="confirmNewTag()"
                (blur)="confirmNewTag()"
                placeholder="Новый тег"
              />
              <button type="button" class="task-detail-add-tag" (click)="addTag()" aria-label="Добавить тег" title="Добавить тег">
                <span class="task-detail-add-tag__icon">+</span>
              </button>
            </div>
          </div>
        </div>
        <a routerLink="/teacher" class="task-detail-header__home" aria-label="На главную">⌂</a>
      </header>

      <main class="task-detail-main" *ngIf="!loading">
        <section class="task-detail-content">
          <div class="task-detail-original">
            <h3 class="task-detail-original__title">Текущий вариант</h3>
            <p class="task-detail-original__which">{{ currentVariantLabel() }}</p>
            <textarea
              class="task-detail-original__body"
              [(ngModel)]="variant.content"
              placeholder="Текст задания..."
            ></textarea>
            <button type="button" class="task-detail-save-variant" (click)="saveVariant()" [disabled]="saving">
              Сохранить изменения
            </button>
          </div>
          <div class="task-detail-variants">
            <h3 class="task-detail-variants__title">Варианты этой задачи</h3>
            <p class="task-detail-variants__hint">Первый пункт — исходная формулировка. При большом числе вариантов список прокручивается.</p>
            <div class="task-detail-variants__list">
              <div class="task-detail-variant task-detail-variant--current task-detail-variant--original">
                <div class="task-detail-variant__current">
                  <span class="task-detail-variant__label">Исходный вариант</span>
                </div>
              </div>
            </div>
            <div class="task-detail-variants__actions">
              <button type="button" class="task-detail-btn task-detail-btn--primary" [disabled]="true" title="Доступно после создания задачи">
                Добавить вариант
              </button>
              <button type="button" class="task-detail-btn task-detail-btn--danger" [disabled]="true" title="Доступно после создания задачи">
                Удалить этот вариант
              </button>
            </div>
          </div>
        </section>

        <div class="task-detail-footer-actions">
          <button type="button" class="task-detail-footer-btn task-detail-footer-btn--save" (click)="saveChanges()" [disabled]="saving || !topic">
            Сохранить изменения
          </button>
          <button type="button" class="task-detail-footer-btn task-detail-footer-btn--cancel" (click)="cancel()" [disabled]="saving">Отмена</button>
        </div>
      </main>

      <div *ngIf="loading" class="task-detail-msg task-detail-msg--loading">Загрузка...</div>
      <div *ngIf="error" class="task-detail-msg task-detail-msg--error">{{ error }}</div>
      <div *ngIf="successMsg" class="task-detail-msg task-detail-msg--success">{{ successMsg }}</div>
    </div>
  `,
  styles: [`
    .task-detail-layout {
      min-height: 100vh; box-sizing: border-box;
      font-size: clamp(15px, 0.55vw + 12px, 22px);
      line-height: 1.45;
      background: #eef1ff;
      padding: 1.25em 1.5em 1.75em;
    }
    .task-detail-header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 0.85em;
      flex-wrap: wrap; margin-bottom: 1em;
    }
    .task-detail-header__left {
      display: flex; align-items: flex-start; gap: 0.6em; flex: 1 1 auto; min-width: 0;
    }
    .task-detail-header__grow {
      flex: 1 1 auto; min-width: 0; width: 100%; display: flex; flex-direction: column; gap: 0.55em;
    }
    .task-detail-header__home {
      display: flex; align-items: center; justify-content: center; width: 2.75em; height: 2.75em; flex-shrink: 0;
      border-radius: 0.55em; background: #fff; border: 1px solid #d1d5e6; color: #374151;
      text-decoration: none; font-size: 1.15em; padding: 0; cursor: pointer; font-family: inherit;
      box-sizing: border-box;
    }
    .task-detail-header__home:hover { background: #f5f6fb; border-color: #b2b9ee; }
    .task-detail-header__title-box {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.55em; padding: 0.5em 0.85em;
      width: 100%; min-width: 0; max-width: 100%; box-sizing: border-box;
    }
    .task-detail-header__title-input {
      border: 0; outline: 0; font-size: 1.05em; font-weight: 600; width: 100%; min-width: 8em;
      display: block; min-height: 1.5em; line-height: 1.35;
      font-family: inherit; box-sizing: border-box;
    }
    .task-detail-tags-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.45em;
    }
    .task-detail-tag {
      display: inline-flex; align-items: center; gap: 0.2em;
      padding: 0.25em 0.5em; border-radius: 0.45em; background: #c8e6c9; color: #1b5e20; font-size: 0.9em;
    }
    .task-detail-tag__remove {
      padding: 0; margin: 0; border: 0; background: none; cursor: pointer; font-size: 1em; line-height: 1; color: #1b5e20; opacity: 0.8;
    }
    .task-detail-tag__remove:hover { opacity: 1; }
    .task-detail-tag-input {
      min-width: 8em; flex: 1; max-width: 16em; padding: 0.35em 0.5em; font-size: 0.95em; border: 1px solid #94a3b8; border-radius: 0.45em;
    }
    .task-detail-add-tag {
      width: 1.75em; height: 1.75em; border-radius: 50%; border: 1px solid #94a3b8; background: #fff;
      display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; flex-shrink: 0;
    }
    .task-detail-add-tag:hover { background: #f1f5f9; border-color: #64748b; }
    .task-detail-add-tag__icon { font-size: 1.1em; font-weight: 300; line-height: 1; color: #475569; }

    .task-detail-main {
      display: flex; flex-direction: column; gap: 1em;
      width: 100%; max-width: none; box-sizing: border-box;
      min-height: min(65vh, 38em);
    }
    .task-detail-content { display: grid; grid-template-columns: minmax(0, 1fr) minmax(10em, 18vw); gap: 1.1em; width: 100%; min-width: 0; align-items: stretch; }
    .task-detail-content > .task-detail-variants { align-self: stretch; }
    .task-detail-original {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 1em 1.15em;
      display: flex; flex-direction: column; min-height: min(48vh, 26em);
    }
    .task-detail-original__title { margin: 0 0 0.25em; font-size: 0.95em; font-weight: 600; color: #64748b; }
    .task-detail-original__which { margin: 0 0 0.55em; font-size: 0.95em; font-weight: 600; color: #0f172a; }
    .task-detail-original__body {
      width: 100%; flex: 1 1 auto; min-height: min(28vh, 14em); border: 0; resize: vertical; font-size: 1em; font-family: inherit;
      box-sizing: border-box; outline: 0;
    }
    .task-detail-save-variant {
      flex-shrink: 0; margin-top: 0.75em; width: 100%; padding: 0.65em 1em; border-radius: 0.55em; border: 0;
      cursor: pointer; font-size: 1em; font-weight: 500; background: #a5c8ff; color: #1e3a5f;
    }
    .task-detail-save-variant:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-save-variant:disabled { opacity: 0.6; cursor: not-allowed; }

    .task-detail-footer-actions {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75em; width: 100%; box-sizing: border-box;
    }
    .task-detail-footer-btn {
      padding: 0.65em 1em; border-radius: 0.55em; border: 0; cursor: pointer; font-size: 1em; font-weight: 500; width: 100%;
    }
    .task-detail-footer-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .task-detail-footer-btn--save { background: #a5c8ff; color: #1e3a5f; }
    .task-detail-footer-btn--save:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-footer-btn--cancel { background: #e2e8f0; color: #334155; }
    .task-detail-footer-btn--cancel:hover:not(:disabled) { background: #cbd5e1; color: #0f172a; }
    .task-detail-variants {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 1em;
      display: flex; flex-direction: column; min-height: min(48vh, 26em); max-height: min(75vh, 40em);
      box-sizing: border-box;
    }
    .task-detail-variants__title { margin: 0 0 0.4em; font-size: 1.1em; font-weight: 600; color: #111827; flex-shrink: 0; }
    .task-detail-variants__hint {
      margin: 0 0 0.65em; font-size: 0.82em; color: #64748b; line-height: 1.35; flex-shrink: 0;
    }
    .task-detail-variants__list {
      flex: 1 1 auto; min-height: 6em; overflow-y: auto; overflow-x: hidden;
      border: 1px solid #e2e8f0; border-radius: 0.45em; padding: 0.15em 0;
      -webkit-overflow-scrolling: touch;
    }
    .task-detail-variants__actions {
      flex-shrink: 0; margin-top: 0.75em; padding-top: 0.75em; border-top: 1px solid #e5e7eb;
      display: flex; flex-direction: column; gap: 0.5em;
    }
    .task-detail-variant {
      display: flex; align-items: flex-start; justify-content: space-between; padding: 0.55em 0.65em;
      border-bottom: 1px solid #e5e7eb; font-size: 1em;
    }
    .task-detail-variant:last-child { border-bottom: none; }
    .task-detail-variant--current { background: #f0f9ff; }
    .task-detail-variant--original .task-detail-variant__label { font-weight: 600; color: #0f172a; }
    .task-detail-variant__current { display: flex; flex-direction: column; gap: 0.15em; min-width: 0; flex: 1; }
    .task-detail-btn {
      padding: 0.65em 1em; border-radius: 0.55em; border: 0; cursor: pointer; font-size: 1em; font-weight: 500; width: 100%;
    }
    .task-detail-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .task-detail-btn--primary { background: #a5c8ff; color: #1e3a5f; }
    .task-detail-btn--primary:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-btn--danger { background: #fecaca; color: #991b1b; }
    .task-detail-btn--danger:hover:not(:disabled) { background: #fca5a5; }
    .task-detail-msg { padding: 1em; font-size: 1em; }
    .task-detail-msg--loading { color: #64748b; }
    .task-detail-msg--error { color: #b91c1c; }
    .task-detail-msg--success { color: #15803d; }
  `],
})
/**
 * Компонент создания и редактирования задачи.
 */
export class TaskEditComponent implements OnInit {
  topic: AssignmentDetailDto | null = null;
  topicId = 0;
  taskTitle = '';
  variant: VariantDetailDto = { id: 0, assignmentId: 0, taskId: 0, variantName: '', content: null };
  displayTags: string[] = [];
  showNewTagInput = false;
  newTagValue = '';
  loading = true;
  error = '';
  saving = false;
  successMsg = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  /**
   * Возвращает пользователя к странице темы.
   */
  goBack(): void {
    void this.router.navigateByUrl(`/teacher/topics/${this.topicId}`);
  }

  /**
   * Загружает тему для создания новой задачи.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.topicId = +id;
      this.auth.getAssignment(this.topicId).subscribe({
        next: (t) => {
          this.topic = t;
          this.displayTags = [];
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          if (err?.status === 401) this.router.navigateByUrl('/login');
          else this.error = 'Тема не найдена';
        },
      });
    } else {
      this.loading = false;
      this.error = 'Тема не указана';
    }
  }

  /**
   * Возвращает название текущего варианта.
   */
  currentVariantLabel(): string {
    return 'Исходный вариант';
  }

  /**
   * Удаляет тег из списка тегов задачи.
   */
  removeTag(i: number): void {
    this.displayTags.splice(i, 1);
  }

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
   * Сохраняет задачу и ее исходный вариант.
   */
  saveVariant(): void {
    this.saveChanges();
  }

  /**
   * Создает задачу, сохраняет вариант и открывает страницу задачи.
   */
  saveChanges(): void {
    if (!this.topic) return;
    const title = (this.taskTitle || '').trim();
    if (!title) {
      this.error = 'Укажите название задачи';
      return;
    }
    this.saving = true;
    this.error = '';
    this.successMsg = '';
    this.auth.createTask(this.topicId, { title, tags: this.displayTags }).subscribe({
      next: (td) => {
        const taskId = td.id;
        const first = td.variants?.[0];
        if (!first) {
          this.saving = false;
          this.error = 'Задача создана без вариантов';
          return;
        }
        const content = this.variant.content ?? undefined;
        this.auth.updateVariant(this.topicId, taskId, first.id, { content: content === '' ? undefined : content }).subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/teacher/topics', this.topicId, 'tasks', taskId, 'variants', first.id]);
          },
          error: (err: HttpErrorResponse) => {
            this.saving = false;
            if (err?.status === 401) this.router.navigateByUrl('/login');
            else this.error = 'Ошибка сохранения';
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = 'Ошибка создания задачи';
      },
    });
  }

  /**
   * Отменяет создание задачи и возвращает к теме.
   */
  cancel(): void {
    this.router.navigate(['/teacher/topics', this.topicId]);
  }
}
