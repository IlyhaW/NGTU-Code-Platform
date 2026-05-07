import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TaskDetailDto, VariantDetailDto } from '../../api.types';

interface SessionGeneratedItem {
  id: number;
  label: string;
  content: string;
}

@Component({
  selector: 'app-task-generate-variants',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="task-detail-layout">
      <header class="task-detail-header">
        <div class="task-detail-header__left">
          <button type="button" class="task-detail-header__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="task-detail-header__grow">
            <div class="task-detail-header__title-box task-detail-gen__status-box">
              <span class="task-detail-gen__status-text">{{ taskDetail?.title || 'Задача' }}</span>
            </div>
          </div>
        </div>
        <a routerLink="/teacher" class="task-detail-header__home" aria-label="На главную">⌂</a>
      </header>

      <main class="task-detail-main">
        <div class="task-detail-gen-columns">
          <section class="task-detail-original task-detail-gen__source">
            <h3 class="task-detail-original__title">Исходный вариант</h3>
            <textarea
              class="task-detail-original__body"
              [(ngModel)]="originalContent"
              rows="14"
              placeholder="Текст задания..."
            ></textarea>
            <button type="button" class="task-detail-save-variant" (click)="saveOriginal()" [disabled]="savingOriginal">
              Сохранить изменения
            </button>
          </section>

          <section class="task-detail-original task-detail-gen__config">
            <h3 class="task-detail-variants__title">Выберите конфигурацию</h3>
            <label class="task-detail-gen__field">
              <span class="task-detail-gen__field-label">Сложность: от 1 до 5</span>
              <input
                type="number"
                class="task-detail-gen__control"
                min="1"
                max="5"
                [(ngModel)]="genDifficulty"
              />
            </label>
            <label class="task-detail-gen__field">
              <span class="task-detail-gen__field-label">Количество вариантов</span>
              <input
                type="number"
                class="task-detail-gen__control"
                min="1"
                max="300"
                [(ngModel)]="genCount"
              />
            </label>
            <label class="task-detail-gen__field">
              <span class="task-detail-gen__field-label">Стиль</span>
              <input
                type="text"
                class="task-detail-gen__control"
                [(ngModel)]="genStyle"
                placeholder="Например: формальный"
              />
            </label>
            <button type="button" class="task-detail-btn task-detail-btn--primary" (click)="runGenerate(false)" [disabled]="working">
              Сгенерировать
            </button>
          </section>

          <section class="task-detail-variants task-detail-gen__middle">
            <h3 class="task-detail-variants__title">Сгенерированные варианты</h3>
            <div class="task-detail-variants__list">
              <div *ngIf="sessionGenerated.length === 0" class="task-detail-gen__empty">
                Пока пусто. Нажмите «Сгенерировать».
              </div>
              <div
                *ngFor="let item of sessionGenerated; let i = index"
                class="task-detail-variant"
                [class.task-detail-variant--current]="item.id === selectedSessionId"
                (click)="selectSession(item.id)"
              >
                <span class="task-detail-variant__label">{{ item.label }}</span>
                <button
                  type="button"
                  class="task-detail-gen__remove"
                  (click)="removeSessionItem($event, item.id)"
                  aria-label="Удалить вариант"
                >
                  ×
                </button>
              </div>
            </div>
          </section>

          <section class="task-detail-variants task-detail-gen__preview-col">
            <h3 class="task-detail-variants__title">Содержимое варианта</h3>
            <div class="task-detail-gen__preview">
              <div *ngIf="!selectedSession" class="task-detail-gen__empty">
                Выберите вариант из списка слева.
              </div>
              <ng-container *ngIf="selectedSession">
                <h4 class="task-detail-gen__preview-title">{{ selectedSession.label }}</h4>
                <pre class="task-detail-gen__preview-body">{{ selectedSession.content }}</pre>
              </ng-container>
            </div>
          </section>
        </div>

        <div class="task-detail-footer-actions">
          <button
            type="button"
            class="task-detail-footer-btn task-detail-footer-btn--save"
            (click)="saveAndBack()"
            [disabled]="working || savingOriginal"
          >
            Сохранить
          </button>
          <button
            type="button"
            class="task-detail-footer-btn task-detail-footer-btn--delete"
            (click)="runGenerate(true)"
            [disabled]="working"
          >
            Сгенерировать варианты заново
          </button>
        </div>
      </main>

      <div class="task-detail-gen__toasts">
        <div *ngIf="loading" class="task-detail-msg task-detail-msg--loading">Загрузка...</div>
        <div *ngIf="error" class="task-detail-msg task-detail-msg--error">{{ error }}</div>
        <div *ngIf="infoMsg" class="task-detail-msg task-detail-msg--success">{{ infoMsg }}</div>
      </div>
    </div>
  `,
  styles: [`
    .task-detail-layout {
      box-sizing: border-box;
      height: 100vh;
      height: 100dvh;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-size: clamp(15px, 0.55vw + 12px, 22px);
      line-height: 1.45;
      background: #eef1ff;
      padding: 1.25em 1.5em 1.25em;
    }
    .task-detail-header {
      flex-shrink: 0;
      display: flex; justify-content: space-between; align-items: flex-start; gap: 0.85em;
      flex-wrap: wrap; margin-bottom: 0.85em;
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
    .task-detail-gen__status-box { display: flex; align-items: center; justify-content: center; min-height: 2.75em; }
    .task-detail-gen__status-text { font-weight: 600; color: #0f172a; font-size: 1.05em; }
    .task-detail-main {
      flex: 1 1 auto;
      min-height: 0;
      display: flex; flex-direction: column; gap: 0.85em;
      width: 100%; max-width: none; box-sizing: border-box;
      overflow: hidden;
    }
    .task-detail-gen-columns {
      flex: 1 1 auto;
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(12em, 0.9fr) minmax(13em, 1fr) minmax(0, 1.25fr);
      grid-template-rows: minmax(0, 1fr);
      gap: 1.1em;
      width: 100%;
      min-width: 0;
      align-items: stretch;
      overflow: hidden;
    }
    @media (max-width: 900px) {
      .task-detail-gen-columns {
        grid-template-columns: 1fr;
        overflow-y: auto;
        align-items: stretch;
      }
    }
    .task-detail-gen-columns .task-detail-original,
    .task-detail-gen-columns .task-detail-variants {
      min-height: 0;
      height: 100%;
      max-height: none;
      overflow: hidden;
    }
    .task-detail-original {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 1em 1.15em;
      display: flex; flex-direction: column;
    }
    .task-detail-original__title { margin: 0 0 0.25em; font-size: 0.95em; font-weight: 600; color: #64748b; }
    .task-detail-gen__hint {
      margin: 0 0 0.65em; font-size: 0.82em; color: #64748b; line-height: 1.35;
    }
    .task-detail-gen-columns .task-detail-original__body {
      min-height: 5em;
    }
    .task-detail-original__body {
      width: 100%; flex: 1 1 auto; min-height: 0; border: 0; resize: none; font-size: 1em; font-family: inherit;
      box-sizing: border-box; outline: 0;
    }
    .task-detail-save-variant {
      flex-shrink: 0; margin-top: 0.75em; width: 100%; padding: 0.65em 1em; border-radius: 0.55em; border: 0;
      cursor: pointer; font-size: 1em; font-weight: 500; background: #a5c8ff; color: #1e3a5f;
    }
    .task-detail-save-variant:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-save-variant:disabled { opacity: 0.6; cursor: not-allowed; }
    .task-detail-variants {
      background: #fff; border: 1px solid #d1d5e6; border-radius: 0.65em; padding: 1em;
      display: flex; flex-direction: column;
      box-sizing: border-box;
    }
    .task-detail-gen__config {
      justify-content: space-between;
    }
    .task-detail-gen__config .task-detail-variants__title { margin-bottom: 0.75em; }
    .task-detail-gen__config .task-detail-variants__title,
    .task-detail-gen__config .task-detail-gen__field-label {
      color: #475569;
    }
    .task-detail-gen__config .task-detail-btn {
      margin-top: auto;
    }
    .task-detail-variants__title { margin: 0 0 0.4em; font-size: 1.1em; font-weight: 600; color: #111827; flex-shrink: 0; }
    .task-detail-variants__list {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden;
      border: 1px solid #e2e8f0; border-radius: 0.45em; padding: 0.15em 0;
      -webkit-overflow-scrolling: touch;
    }
    .task-detail-gen__empty { padding: 0.85em; color: #64748b; font-size: 0.92em; line-height: 1.35; }
    .task-detail-variant {
      display: flex; align-items: flex-start; justify-content: space-between; padding: 0.55em 0.65em;
      border-bottom: 1px solid #e5e7eb; font-size: 1em; cursor: pointer;
    }
    .task-detail-variant:last-child { border-bottom: none; }
    .task-detail-variant--current { background: #f0f9ff; outline: 1px solid #93c5fd; outline-offset: -1px; }
    .task-detail-variant__label { font-weight: 500; color: #0f172a; }
    .task-detail-gen__remove {
      flex-shrink: 0; margin: 0; padding: 0 0.35em; border: 0; background: none; cursor: pointer;
      font-size: 0.68em;
      line-height: 1.1;
      color: #991b1b;
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 0.45em;
      padding: 0.26em 0.5em;
      font-weight: 600;
      width: auto;
      min-width: 0;
      align-self: center;
    }
    .task-detail-gen__remove:hover {
      background: #fecaca;
      border-color: #f87171;
    }
    .task-detail-gen__preview-col { display: flex; flex-direction: column; }
    .task-detail-gen__preview {
      margin-top: 0;
      border: 1px solid #e2e8f0;
      border-radius: 0.45em;
      background: #f8fafc;
      padding: 0.65em 0.7em;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }
    .task-detail-gen__preview-title {
      margin: 0 0 0.35em;
      font-size: 0.86em;
      color: #334155;
      font-weight: 600;
    }
    .task-detail-gen__preview-body {
      margin: 0;
      white-space: pre-wrap;
      font-size: 0.82em;
      line-height: 1.35;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .task-detail-gen__field {
      display: flex; flex-direction: column; gap: 0.45em; margin-bottom: 0.9em; width: 100%; min-width: 0;
      flex: 1 1 auto;
    }
    .task-detail-gen__field-label { font-size: 1em; color: #64748b; font-weight: 600; }
    .task-detail-gen__control {
      width: 100%; min-width: 0; box-sizing: border-box;
      padding: 1em 1.1em; min-height: 3.8em; font-size: 1.12em; font-family: inherit;
      border: 1px solid #94a3b8; border-radius: 0.5em; background: #fff;
    }
    .task-detail-gen__control:focus { outline: 2px solid #a5c8ff; outline-offset: 0; border-color: #7c9ee0; }
    .task-detail-btn {
      padding: 0.65em 1em; border-radius: 0.55em; border: 0; cursor: pointer; font-size: 1em; font-weight: 500; width: 100%;
      margin-top: 0.35em;
    }
    .task-detail-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .task-detail-btn--primary { background: #a5c8ff; color: #1e3a5f; }
    .task-detail-btn--primary:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-footer-actions {
      flex-shrink: 0;
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75em; width: 100%; box-sizing: border-box;
    }
    .task-detail-gen__toasts {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35em;
      margin-top: 0.25em;
    }
    .task-detail-footer-btn {
      padding: 0.65em 1em; border-radius: 0.55em; border: 0; cursor: pointer; font-size: 1em; font-weight: 500; width: 100%;
    }
    .task-detail-footer-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .task-detail-footer-btn--save { background: #a5c8ff; color: #1e3a5f; }
    .task-detail-footer-btn--save:hover:not(:disabled) { background: #8bb8ff; }
    .task-detail-footer-btn--delete { background: #fecaca; color: #991b1b; }
    .task-detail-footer-btn--delete:hover:not(:disabled) { background: #fca5a5; }
    .task-detail-msg { padding: 1em; font-size: 1em; }
    .task-detail-msg--loading { color: #64748b; }
    .task-detail-msg--error { color: #b91c1c; }
    .task-detail-msg--success { color: #15803d; }
  `],
})
/**
 * Компонент генерации вариантов формулировок задачи.
 */
export class TaskGenerateVariantsComponent implements OnInit {
  topicId = 0;
  taskId = 0;
  /**
   * Идентификатор исходного варианта задачи.
   */
  originalVariantId = 0;
  taskDetail: TaskDetailDto | null = null;
  originalContent = '';
  sessionGenerated: SessionGeneratedItem[] = [];
  selectedSessionId: number | null = null;
  genCount = 5;
  genDifficulty = 3;
  genStyle = '';
  loading = true;
  working = false;
  savingOriginal = false;
  error = '';
  infoMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  /**
   * Возвращает пользователя на страницу задачи.
   */
  goBack(): void {
    void this.router.navigate(['/teacher/topics', this.topicId, 'tasks', this.taskId]);
  }

  /**
   * Возвращает количество сгенерированных вариантов в текущей сессии.
   */
  get generatedCount(): number {
    return this.sessionGenerated.length;
  }

  /**
   * Возвращает выбранный сгенерированный вариант.
   */
  get selectedSession(): SessionGeneratedItem | null {
    if (this.selectedSessionId == null) return null;
    return this.sessionGenerated.find((x) => x.id === this.selectedSessionId) ?? null;
  }

  /**
   * Инициализирует страницу генерации вариантов.
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tid = params.get('id');
      const tk = params.get('taskId');
      if (!tid || !tk) {
        this.loading = false;
        this.error = 'Задача не указана';
        return;
      }
      this.topicId = +tid;
      this.taskId = +tk;
      this.load();
    });
  }

  /**
   * Загружает данные задачи и исходного варианта.
   */
  private load(): void {
    this.loading = true;
    this.error = '';
    this.auth.getTask(this.topicId, this.taskId).subscribe({
      next: (td) => {
        this.taskDetail = td;
        const first = td.variants?.[0];
        if (!first) {
          this.loading = false;
          this.error = 'У задачи нет исходного варианта';
          return;
        }
        this.originalVariantId = first.id;
        this.auth.getVariant(this.topicId, this.taskId, first.id).subscribe({
          next: (v) => {
            this.originalContent = v.content ?? '';
            this.loading = false;
          },
          error: (err: HttpErrorResponse) => {
            this.loading = false;
            if (err?.status === 401) this.router.navigateByUrl('/login');
            else this.error = 'Ошибка загрузки';
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err?.status === 401) this.router.navigateByUrl('/login');
        else this.error = err?.status === 404 ? 'Задача не найдена' : 'Ошибка загрузки';
      },
    });
  }

  /**
   * Сохраняет текст исходного варианта.
   */
  saveOriginal(): void {
    if (!this.originalVariantId) return;
    this.savingOriginal = true;
    this.error = '';
    this.auth
      .updateVariant(this.topicId, this.taskId, this.originalVariantId, {
        variantName: 'Исходный вариант',
        content: this.originalContent ?? undefined,
      })
      .subscribe({
        next: () => {
          this.savingOriginal = false;
          this.flashInfo('Исходный вариант сохранён');
        },
        error: (err: HttpErrorResponse) => {
          this.savingOriginal = false;
          if (err?.status === 401) this.router.navigateByUrl('/login');
          else this.error = 'Не удалось сохранить';
        },
      });
  }

  /**
   * Показывает информационное сообщение на короткое время.
   */
  private flashInfo(text: string): void {
    this.infoMsg = text;
    setTimeout(() => (this.infoMsg = ''), 2500);
  }

  /**
   * Выбирает вариант из результатов текущей сессии.
   */
  selectSession(id: number): void {
    this.selectedSessionId = id;
  }

  /**
   * Удаляет вариант из локального списка сессии.
   */
  removeSessionItem(ev: Event, id: number): void {
    ev.stopPropagation();
    this.sessionGenerated = this.sessionGenerated.filter((x) => x.id !== id);
    if (this.selectedSessionId === id) this.selectedSessionId = null;
  }

  /**
   * Запускает генерацию вариантов с выбранными параметрами.
   */
  runGenerate(replaceExisting: boolean): void {
    if (!this.topicId || !this.taskId) return;
    const count = Math.max(1, Math.min(300, Number(this.genCount) || 1));
    const difficulty = Math.max(1, Math.min(5, Number(this.genDifficulty) || 3));
    this.working = true;
    this.error = '';
    this.auth
      .generateVariants(this.topicId, this.taskId, {
        count,
        difficulty,
        style: this.genStyle?.trim() || undefined,
        replaceExisting,
      })
      .subscribe({
        next: (rows) => {
          this.working = false;
          const mapped = (rows ?? []).map((v) => this.mapSessionItem(v));
          this.sessionGenerated = mapped;
          this.selectedSessionId = mapped.length > 0 ? mapped[0].id : null;
          this.flashInfo(`Сгенерировано вариантов: ${mapped.length}`);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.working = false;
          if (err?.status === 401) {
            void this.router.navigateByUrl('/login');
            return;
          }
          const msg = (err?.error as { message?: string } | null)?.message;
          this.error = msg && msg.trim() ? msg : 'Не удалось сгенерировать варианты.';
        },
      });
  }

  /**
   * Преобразует вариант API в элемент локальной сессии.
   */
  private mapSessionItem(v: VariantDetailDto): SessionGeneratedItem {
    return {
      id: v.id,
      label: v.variantName || `Вариант ${v.id}`,
      content: v.content ?? '',
    };
  }

  /**
   * Сохраняет исходный вариант и возвращает на страницу задачи.
   */
  saveAndBack(): void {
    const go = () => {
      const first = this.taskDetail?.variants?.[0];
      if (first) {
        this.router.navigate(['/teacher/topics', this.topicId, 'tasks', this.taskId, 'variants', first.id]);
      } else {
        this.router.navigate(['/teacher/topics', this.topicId]);
      }
    };
    if (!this.originalVariantId) {
      go();
      return;
    }
    this.savingOriginal = true;
    this.error = '';
    this.auth
      .updateVariant(this.topicId, this.taskId, this.originalVariantId, {
        variantName: 'Исходный вариант',
        content: this.originalContent ?? undefined,
      })
      .subscribe({
        next: () => {
          this.savingOriginal = false;
          go();
        },
        error: (err: HttpErrorResponse) => {
          this.savingOriginal = false;
          if (err?.status === 401) this.router.navigateByUrl('/login');
          else this.error = 'Не удалось сохранить перед выходом';
        },
      });
  }
}
