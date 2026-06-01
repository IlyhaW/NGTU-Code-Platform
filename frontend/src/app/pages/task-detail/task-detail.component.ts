import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AssignmentDetailDto, TaskDetailDto, VariantDetailDto } from '../../api.types';

@Component({
  selector: 'app-task-detail',
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

      <main class="task-detail-main">
        <section class="task-detail-content">
          <div class="task-detail-original">
            <h3 class="task-detail-original__title">{{ leftColumnTitle() }}</h3>
            <textarea
              class="task-detail-original__body"
              [(ngModel)]="variant.content"
              placeholder="Текст задания..."
            ></textarea>
            <button
              type="button"
              class="task-detail-save-variant"
              (click)="openTestCases()"
              [disabled]="saving"
            >Тест-кейсы</button>
          </div>
          <div class="task-detail-variants">
            <h3 class="task-detail-variants__title">Варианты этой задачи</h3>
            <div class="task-detail-variants__list">
              <div
                *ngFor="let v of taskVariants; let i = index"
                [class.task-detail-variant--current]="v.id === variantId"
                [class.task-detail-variant--original]="i === 0"
                class="task-detail-variant"
              >
                <div class="task-detail-variant__main">
                  <a
                    *ngIf="v.id !== variantId"
                    [routerLink]="['/teacher/topics', topicId, 'tasks', taskId, 'variants', v.id]"
                    class="task-detail-variant__link"
                  >
                    <span class="task-detail-variant__label">{{ variantDisplayName(v, i) }}</span>
                  </a>
                  <div *ngIf="v.id === variantId" class="task-detail-variant__current">
                    <span class="task-detail-variant__label">{{ variantDisplayName(v, i) }}</span>
                  </div>
                </div>
                <button
                  *ngIf="i > 0"
                  type="button"
                  class="task-detail-variant__remove"
                  (click)="removeVariant($event, v, i)"
                  [disabled]="saving"
                  aria-label="Удалить вариант"
                >×</button>
              </div>
            </div>
            <div class="task-detail-variants__actions">
              <button type="button" class="task-detail-btn task-detail-btn--primary" (click)="addVariant()" [disabled]="saving">Добавить вариант</button>
              <button
                type="button"
                class="task-detail-btn task-detail-btn--primary"
                [routerLink]="['/teacher/topics', topicId, 'tasks', taskId, 'generate-variants']"
                [disabled]="saving"
              >Сгенерировать варианты</button>
            </div>
          </div>
          <div class="task-detail-judge-column">
            <div class="task-detail-judge">
              <h3 class="task-detail-judge__title">Параметры проверки</h3>
              <div class="task-detail-judge__formats">
                <label class="task-detail-judge__label task-detail-judge__label--grow">
                  Формат входных данных
                  <textarea
                    class="task-detail-judge__area"
                    [(ngModel)]="inputFormat"
                    placeholder="Опишите ожидаемый формат stdin"
                  ></textarea>
                </label>
                <label class="task-detail-judge__label task-detail-judge__label--grow">
                  Формат выходных данных
                  <textarea
                    class="task-detail-judge__area"
                    [(ngModel)]="outputFormat"
                    placeholder="Опишите ожидаемый формат stdout"
                  ></textarea>
                </label>
              </div>
              <div class="task-detail-judge__limits">
                <label class="task-detail-judge__label">
                  Лимит времени (сек)
                  <input type="number" min="1" step="1" class="task-detail-judge__input" [(ngModel)]="judgeTimeLimitSeconds" />
                </label>
                <label class="task-detail-judge__label">
                  Лимит памяти (МБ)
                  <input type="number" min="1" step="1" class="task-detail-judge__input" [(ngModel)]="judgeMemoryLimitMb" />
                </label>
              </div>
              <label class="task-detail-judge__label task-detail-judge__label--algorithm">
                Алгоритм решения
                <textarea
                  class="task-detail-judge__area task-detail-judge__area--algorithm"
                  [(ngModel)]="solutionAlgorithm"
                  rows="3"
                  placeholder="Описание решения, формула или псевдокод — единый для всех вариантов задачи"
                ></textarea>
              </label>
            </div>
          </div>
        </section>

        <div class="task-detail-footer-actions">
          <button type="button" class="task-detail-footer-btn task-detail-footer-btn--save" (click)="saveChanges()" [disabled]="saving || !topic">Сохранить изменения</button>
          <button type="button" class="task-detail-footer-btn task-detail-footer-btn--delete" (click)="deleteTask()" [disabled]="saving">Удалить задачу целиком</button>
        </div>
      </main>

      <div *ngIf="loading" class="task-detail-msg task-detail-msg--loading">Загрузка...</div>
      <div *ngIf="error" class="task-detail-msg task-detail-msg--error">{{ error }}</div>
      <div *ngIf="successMsg" class="task-detail-msg task-detail-msg--success">{{ successMsg }}</div>
    </div>
  `,
  styles: [`
    .task-detail-layout {
      position: fixed;
      inset: 0;
      z-index: 0;
      height: 100dvh;
      max-height: 100dvh;
      min-height: 0;
      box-sizing: border-box;
      font-size: clamp(15px, 0.55vw + 12px, 22px);
      line-height: 1.45;
      background: #eef1ff;
      padding: 0.9em 1.35em 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
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
      display: flex; flex-direction: column; gap: 0.75em;
      width: 100%; max-width: none; box-sizing: border-box;
      flex: 1 1 auto;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .task-detail-content { display: grid; grid-template-columns: minmax(0, 1fr) minmax(12.5em, 20vw) minmax(14.5em, 24vw); gap: 1.1em; width: 100%; min-width: 0; align-items: stretch; flex: 1 1 auto; min-height: 0; padding-bottom: 4.1em; }
    .task-detail-content > .task-detail-variants { align-self: stretch; }
    .task-detail-content > .task-detail-judge-column { align-self: stretch; }
    .task-detail-original {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 1em 1.15em;
      display: flex; flex-direction: column; min-height: 0;
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
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      margin-top: 0;
      padding: 0 0 0.25em;
      background: #eef1ff;
      z-index: 2;
    }
    .task-detail-footer-btn {
      padding: 0.65em 1em; border-radius: 0.55em; border: 0; cursor: pointer; font-size: 1em; font-weight: 500; width: 100%;
    }
    .task-detail-footer-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .task-detail-footer-btn--save { background: #a5c8ff; color: #1e3a5f; }
    .task-detail-footer-btn--save:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-footer-btn--delete { background: #fecaca; color: #991b1b; }
    .task-detail-footer-btn--delete:hover:not(:disabled) { background: #fca5a5; }
    .task-detail-variants {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 1em;
      display: flex; flex-direction: column; min-height: 0;
      box-sizing: border-box;
    }
    .task-detail-judge-column {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 1em;
      box-sizing: border-box; min-height: 0;
      display: flex; flex-direction: column;
    }
    .task-detail-judge {
      border: 0;
      border-radius: 0;
      padding: 0;
      margin: 0;
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      flex: 1 1 auto;
      min-height: 0;
    }
    .task-detail-judge__title { margin: 0; font-size: 0.92em; font-weight: 600; color: #334155; }
    .task-detail-judge__formats {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      flex: 1 1 auto;
      min-height: 0;
    }
    .task-detail-judge__limits {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      flex-shrink: 0;
    }
    .task-detail-judge__label {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      font-size: 0.84em;
      font-weight: 600;
      color: #475569;
    }
    .task-detail-judge__label--grow { flex: 1 1 0; min-height: 0; }
    .task-detail-judge__label--algorithm {
      flex: 0 0 auto;
      flex-shrink: 0;
    }
    .task-detail-judge__area--algorithm {
      height: auto;
      min-height: 3.2em;
      max-height: 5.5em;
      resize: vertical;
    }
    .task-detail-judge__area {
      width: 100%;
      min-height: 0;
      height: 100%;
      resize: none;
      border: 1px solid #cbd5e1;
      border-radius: 0.45em;
      padding: 0.5em 0.6em;
      box-sizing: border-box;
      font: inherit;
      font-size: 0.95em;
      background: #fff;
    }
    .task-detail-judge__input {
      width: 100%;
      min-height: 2.2em;
      border: 1px solid #cbd5e1;
      border-radius: 0.45em;
      padding: 0.35em 0.55em;
      box-sizing: border-box;
      font: inherit;
      font-size: 0.95em;
      background: #fff;
    }
    .task-detail-variants__title { margin: 0 0 0.65em; font-size: 1.1em; font-weight: 600; color: #111827; flex-shrink: 0; }
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
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.35em 0.75em;
      padding: 0.1em 0.35em 0.1em 0.45em;
      border-bottom: 1px solid #e5e7eb; font-size: 1em;
    }
    .task-detail-variant:last-child { border-bottom: none; }
    .task-detail-variant:hover { background: #f8fafc; }
    .task-detail-variant--current { background: #f0f9ff; }
    .task-detail-variant--current:hover { background: #e0f2fe; }
    .task-detail-variant--original .task-detail-variant__label { font-weight: 600; color: #0f172a; }
    .task-detail-variant__main { min-width: 0; }
    .task-detail-variant__link {
      color: #2563eb; text-decoration: none; display: flex; flex-direction: column; gap: 0.15em; min-width: 0;
      padding: 0.45em 0.25em 0.45em 0.15em;
    }
    .task-detail-variant__link:hover { text-decoration: underline; }
    .task-detail-variant__link:hover .task-detail-variant__sub { text-decoration: none; }
    .task-detail-variant__current { display: flex; flex-direction: column; gap: 0.15em; min-width: 0; padding: 0.45em 0.25em 0.45em 0.15em; }
    .task-detail-variant__remove {
      justify-self: end; align-self: center;
      width: 2em; height: 2em; padding: 0; margin: 0;
      border: 0; border-radius: 0.35em;
      background: transparent; cursor: pointer; font-size: 1.25em; line-height: 1;
      color: #dc2626; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-family: inherit;
    }
    .task-detail-variant__remove:hover:not(:disabled) { color: #b91c1c; background: rgba(220, 38, 38, 0.1); }
    .task-detail-variant__remove:disabled { opacity: 0.5; cursor: not-allowed; }
    .task-detail-variant__sub { font-size: 0.82em; font-weight: 400; color: #64748b; }
    .task-detail-btn {
      padding: 0.65em 1em; border-radius: 0.55em; border: 0; cursor: pointer; font-size: 1em; font-weight: 500; width: 100%;
      box-sizing: border-box; font-family: inherit;
    }
    .task-detail-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .task-detail-btn--primary { background: #a5c8ff; color: #1e3a5f; }
    .task-detail-btn--primary:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-btn--secondary {
      display: block; text-align: center; text-decoration: none; cursor: pointer;
      background: #fff; color: #1e3a5f; border: 1px solid #a5c8ff;
      padding: 0.65em 1em; border-radius: 0.55em; font-size: 1em; font-weight: 500; width: 100%;
      box-sizing: border-box;
    }
    .task-detail-btn--secondary:hover { background: #f0f9ff; }
    .task-detail-msg { padding: 1em; font-size: 1em; }
    .task-detail-msg--loading { color: #64748b; }
    .task-detail-msg--error { color: #b91c1c; }
    .task-detail-msg--success { color: #15803d; }
  `],
})
/**
 * Компонент детального просмотра задачи и вариантов.
 */
export class TaskDetailComponent implements OnInit {
  variant: VariantDetailDto = { id: 0, assignmentId: 0, taskId: 0, variantName: '', content: null };
  taskTitle = '';
  taskDetail: TaskDetailDto | null = null;
  topic: AssignmentDetailDto | null = null;
  topicId = 0;
  taskId = 0;
  variantId = 0;
  loading = true;
  error = '';
  saving = false;
  successMsg = '';
  displayTags: string[] = [];
  inputFormat = '';
  outputFormat = '';
  solutionAlgorithm = '';
  judgeTimeLimitSeconds: number | null = null;
  judgeMemoryLimitMb: number | null = null;
  showNewTagInput = false;
  newTagValue = '';
  /**
   * Базовое состояние текста варианта после последней синхронизации.
   */
  private variantContentBaseline = '';

  /**
   * Возвращает список вариантов текущей задачи.
   */
  get taskVariants(): { id: number; name: string }[] {
    return this.taskDetail?.variants ?? [];
  }

  /**
   * Формирует отображаемое имя варианта в списке.
   */
  variantDisplayName(_v: { id: number; name: string }, index: number): string {
    if (index === 0) {
      return 'Исходный вариант';
    }
    return `Вариант ${index}`;
  }

  /**
   * Возвращает заголовок левой колонки по активному варианту.
   */
  leftColumnTitle(): string {
    const list = this.taskVariants;
    const i = list.findIndex((x) => x.id === this.variantId);
    if (i < 0) return 'Вариант';
    return i === 0 ? 'Исходный вариант' : `Вариант ${i}`;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  /**
   * Возвращает пользователя к странице темы.
   */
  goBack(): void {
    void this.router.navigateByUrl(`/teacher/topics/${this.topicId}`);
  }

  /**
   * Проверяет наличие несохраненных изменений текста варианта.
   */
  get variantHasUnsavedChanges(): boolean {
    if (this.loading) return false;
    return this.normalizeVariantContent(this.variant.content) !== this.variantContentBaseline;
  }

  /**
   * Нормализует текст варианта к строковому значению.
   */
  private normalizeVariantContent(c: string | null | undefined): string {
    return c ?? '';
  }

  /**
   * Фиксирует текущее значение текста варианта как базовое.
   */
  private captureVariantContentBaseline(): void {
    this.variantContentBaseline = this.normalizeVariantContent(this.variant.content);
  }

  /**
   * Инициализирует компонент и определяет активный вариант.
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tid = params.get('id');
      const tk = params.get('taskId');
      const vid = params.get('variantId');
      if (!tid || !tk || tk === 'new') {
        this.loading = false;
        this.error = 'Задача не указана';
        return;
      }
      this.topicId = +tid;
      this.taskId = +tk;
      if (vid) {
        this.variantId = +vid;
        this.load();
      } else {
        this.loadTaskThenRedirect();
      }
    });
  }

  /**
   * Загружает задачу и перенаправляет на первый вариант.
   */
  private loadTaskThenRedirect(): void {
    this.loading = true;
    this.auth.getTask(this.topicId, this.taskId).subscribe({
      next: (td) => {
        this.taskDetail = td;
        this.taskTitle = td.title;
        const first = td.variants?.[0];
        if (first) {
          this.router.navigate(['/teacher/topics', this.topicId, 'tasks', this.taskId, 'variants', first.id], {
            replaceUrl: true,
          });
        } else {
          this.loading = false;
          this.error = 'У задачи нет вариантов';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = err?.status === 404 ? 'Задача не найдена' : 'Ошибка загрузки';
      },
    });
  }

  /**
   * Загружает тему, задачу и активный вариант.
   */
  private load(): void {
    this.loading = true;
    this.error = '';
    this.auth.getAssignment(this.topicId).subscribe({
      next: (t) => {
        this.topic = t;
      },
      error: () => {},
    });
    forkJoin([
      this.auth.getTask(this.topicId, this.taskId),
      this.auth.getVariant(this.topicId, this.taskId, this.variantId),
    ]).subscribe({
      next: ([td, v]) => {
        this.taskDetail = td;
        this.taskTitle = td.title;
        this.displayTags = [...(td.tags || [])];
        this.inputFormat = td.inputFormat ?? '';
        this.outputFormat = td.outputFormat ?? '';
        this.solutionAlgorithm = td.solutionAlgorithm ?? '';
        this.judgeTimeLimitSeconds = td.judgeTimeLimitMs ? Math.max(1, Math.round(td.judgeTimeLimitMs / 1000)) : null;
        this.judgeMemoryLimitMb = td.judgeMemoryLimitKb ? Math.max(1, Math.round(td.judgeMemoryLimitKb / 1024)) : null;
        const list = td.variants ?? [];
        const idx = list.findIndex((x) => x.id === this.variantId);
        const name =
          idx === 0 ? 'Исходный вариант' : (v.variantName ?? '').trim() || (idx > 0 ? `Вариант ${idx}` : '');
        this.variant = {
          id: v.id,
          assignmentId: v.assignmentId,
          taskId: v.taskId,
          variantName: name,
          content: v.content ?? '',
        };
        this.captureVariantContentBaseline();
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = err?.status === 404 ? 'Вариант не найден' : 'Ошибка загрузки';
      },
    });
  }

  /**
   * Удаляет тег из списка отображаемых тегов.
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
   * Подтверждает и добавляет новый тег при необходимости.
   */
  confirmNewTag(): void {
    const v = (this.newTagValue || '').trim();
    this.showNewTagInput = false;
    this.newTagValue = '';
    if (v && !this.displayTags.includes(v)) this.displayTags.push(v);
  }

  /**
   * Сохраняет изменения задачи и активного варианта.
   */
  saveChanges(): void {
    const title = (this.taskTitle || '').trim();
    if (!title) {
      this.error = 'Укажите название задачи';
      return;
    }
    this.saving = true;
    this.error = '';
    this.successMsg = '';
    const judgeTimeLimitMs = this.normalizeLimit(this.judgeTimeLimitSeconds, 1000, 120000, 1000);
    const judgeMemoryLimitKb = this.normalizeLimit(this.judgeMemoryLimitMb, 1024, 8388608, 1024);
    const taskUpdate$ = this.auth.updateTask(this.topicId, this.taskId, {
      title,
      tags: this.displayTags,
      inputFormat: this.emptyToNull(this.inputFormat),
      outputFormat: this.emptyToNull(this.outputFormat),
      solutionAlgorithm: this.emptyToNull(this.solutionAlgorithm),
      judgeTimeLimitMs,
      judgeMemoryLimitKb,
    });
    const list = this.taskVariants;
    const idx = list.findIndex((x) => x.id === this.variantId);
    const variantName =
      idx === 0 ? 'Исходный вариант' : (this.variant.variantName || '').trim() || `Вариант ${idx}`;
    const variantUpdate$ = this.auth.updateVariant(this.topicId, this.taskId, this.variantId, {
      variantName,
      content: this.variant.content ?? undefined,
    });
    forkJoin([taskUpdate$, variantUpdate$]).subscribe({
      next: () => {
        this.saving = false;
        if (this.taskDetail) this.taskDetail.title = title;
        if (this.taskDetail) this.taskDetail.tags = [...this.displayTags];
        if (this.taskDetail) this.taskDetail.inputFormat = this.emptyToNull(this.inputFormat);
        if (this.taskDetail) this.taskDetail.outputFormat = this.emptyToNull(this.outputFormat);
        if (this.taskDetail) this.taskDetail.solutionAlgorithm = this.emptyToNull(this.solutionAlgorithm);
        if (this.taskDetail) this.taskDetail.judgeTimeLimitMs = judgeTimeLimitMs;
        if (this.taskDetail) this.taskDetail.judgeMemoryLimitKb = judgeMemoryLimitKb;
        this.captureVariantContentBaseline();
        this.successMsg = 'Сохранено';
        setTimeout(() => (this.successMsg = ''), 2500);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = 'Ошибка сохранения';
      },
    });
  }

  /**
   * Переходит на страницу тест-кейсов текущего варианта.
   */
  openTestCases(): void {
    void this.router.navigate(['/teacher/topics', this.topicId, 'tasks', this.taskId, 'variants', this.variantId, 'test-cases']);
  }

  /**
   * Создает новый вариант задачи и открывает его.
   */
  addVariant(): void {
    this.saving = true;
    this.auth
      .createVariant(this.topicId, this.taskId, {})
      .subscribe({
        next: (created) => {
          this.saving = false;
          this.router.navigate(['/teacher/topics', this.topicId, 'tasks', this.taskId, 'variants', created.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          if (err?.status === 401) this.router.navigateByUrl('/login');
          else this.error = 'Не удалось добавить вариант';
        },
      });
  }

  /**
   * Удаляет выбранный вариант задачи.
   */
  removeVariant(event: Event, v: { id: number; name: string }, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (index === 0) return;
    if (!confirm('Удалить этот вариант?')) return;
    this.saving = true;
    this.error = '';
    const wasCurrent = v.id === this.variantId;
    this.auth.deleteVariant(this.topicId, this.taskId, v.id).subscribe({
      next: () => {
        this.auth.getTask(this.topicId, this.taskId).subscribe({
          next: (td) => {
            this.taskDetail = td;
            this.saving = false;
            const rest = td.variants;
            if (!rest?.length) {
              this.router.navigate(['/teacher/topics', this.topicId]);
              return;
            }
            if (wasCurrent) {
              this.router.navigate(['/teacher/topics', this.topicId, 'tasks', this.taskId, 'variants', rest[0].id]);
            }
          },
          error: () => {
            this.saving = false;
            this.router.navigate(['/teacher/topics', this.topicId]);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = 'Ошибка удаления';
      },
    });
  }

  /**
   * Удаляет задачу вместе со всеми вариантами.
   */
  deleteTask(): void {
    if (!confirm('Удалить задачу и все её варианты?')) return;
    this.saving = true;
    this.auth.deleteTask(this.topicId, this.taskId).subscribe({
      next: () => this.router.navigate(['/teacher/topics', this.topicId]),
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = 'Ошибка удаления задачи';
      },
    });
  }

  /**
   * Преобразует пустую строку в null для API.
   */
  private emptyToNull(value: string): string | null {
    const v = (value ?? '').trim();
    return v ? v : null;
  }

  /**
   * Нормализует лимит и приводит к целевым единицам измерения.
   */
  private normalizeLimit(value: number | null, min: number, max: number, multiplier: number): number | null {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    const normalized = Math.max(1, Math.round(value));
    const raw = normalized * multiplier;
    return Math.max(min, Math.min(max, raw));
  }
}
