import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { StudentCompletedQuestionReviewDto, StudentCompletedTestReviewDto } from '../../api.types';

@Component({
  selector: 'app-student-completed-test-review',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="take">
      <div *ngIf="loading" class="take__msg">Загрузка…</div>
      <div *ngIf="error" class="take__msg take__msg--error">{{ error }}</div>

      <ng-container *ngIf="data && !loading && !error">
        <header class="take__header">
          <div class="take__header-left">
            <a routerLink="/student/tests/completed" class="take__home" aria-label="Назад">←</a>
            <div class="take__title-box">
              <h1 class="take__title">{{ data.testName }}</h1>
            </div>
          </div>
          <a routerLink="/student" class="take__home take__home--right" aria-label="На главную">⌂</a>
        </header>

        <section class="take__task-head">
          <div class="take__header-center">
            <div class="take__pointer-box">
              {{ currentQuestion?.assignmentName ?? '—' }}. Задание {{ activeDisplayIndex }}
            </div>
            <div
              class="take__task-nav"
              *ngIf="questionsOrdered.length > 0"
              role="tablist"
              aria-label="Номера заданий"
            >
              <button
                *ngFor="let q of questionsOrdered; let i = index"
                type="button"
                class="take__task-pill"
                [class.take__task-pill--active]="i === activeTaskIndex"
                (click)="selectTask(i)"
                role="tab"
                [attr.aria-selected]="i === activeTaskIndex"
              >
                {{ i + 1 }}
              </button>
            </div>
          </div>
        </section>

        <section class="take__statement" *ngIf="currentQuestion">
          <h2 class="take__statement-title">Задача №{{ activeDisplayIndex }}</h2>
          <p class="take__statement-taskname">{{ currentQuestion.taskName }}</p>
          <h3 class="take__statement-h3">Условие</h3>
          <div
            class="take__statement-body"
            [class.take__statement-body--placeholder]="isPlaceholderVariantHint(currentQuestion)"
          >
            {{ conditionDisplayText(currentQuestion) }}
          </div>
        </section>

        <div class="take__bottom" *ngIf="currentQuestion">
          <div class="take__editor-wrap">
            <div class="take__editor-label">Ваше решение (Python)</div>
            <pre class="take__editor take__editor--readonly" tabindex="0">{{ currentQuestion.solutionContent || '—' }}</pre>
          </div>
          <aside class="take__side take__side--review">
            <div class="take__meta">
              <p>
                <span class="take__meta-k">Попытки:</span>
                {{ currentQuestion.attemptsUsed }} / {{ currentQuestion.maxAttempts }}
              </p>
              <p>
                <span class="take__meta-k">Время на задаче:</span>
                {{ formatDurationOrDash(currentQuestion.timeSpentSeconds) }}
              </p>
              <p>
                <span class="take__meta-k">Статус:</span>
                {{ currentQuestion.statusLabel }}
              </p>
            </div>
          </aside>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
      }

      .take {
        flex: 1 1 auto;
        min-height: 0;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #d1d5e6;
        padding: 18px 20px 22px;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        box-sizing: border-box;
      }

      .take__msg {
        font-size: 14px;
        color: #64748b;
      }

      .take__msg--error {
        color: #b91c1c;
      }

      .take__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.85em;
        margin-bottom: 16px;
      }

      .take__header-left {
        display: flex;
        align-items: center;
        gap: 0.6em;
        min-width: 0;
      }

      .take__home {
        flex-shrink: 0;
        width: 2.75em;
        height: 2.75em;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.55em;
        border: 1px solid #d1d5e6;
        background: #ffffff;
        color: #374151;
        font-size: 1.15em;
        text-decoration: none;
        line-height: 1;
        font-family: inherit;
      }

      .take__home:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }

      .take__home--right {
        margin-left: auto;
      }

      .take__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.55em 0.9em;
        width: fit-content;
        min-width: 0;
        max-width: 92vw;
      }

      .take__title {
        margin: 0;
        font-size: 1.2em;
        font-weight: 600;
        color: #111827;
        overflow-wrap: anywhere;
      }

      .take__task-head {
        margin-bottom: 16px;
      }

      .take__header-center {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .take__pointer-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.5em 0.8em;
        min-width: min(12em, 40vw);
        max-width: min(36em, 92vw);
        text-align: center;
        font-size: 0.95em;
        font-weight: 600;
        color: #334155;
      }

      .take__task-nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
      }

      .take__task-pill {
        width: 40px;
        height: 40px;
        padding: 0;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #334155;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition:
          background 0.15s,
          border-color 0.15s,
          color 0.15s;
      }

      .take__task-pill:hover {
        background: #ffffff;
        border-color: #93c5fd;
        color: #1d4ed8;
      }

      .take__task-pill--active {
        background: #ffffff;
        border-color: #5b7cff;
        color: #1e3a8a;
      }

      .take__statement {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fafbff;
        padding: 16px 18px;
        margin-bottom: 16px;
      }

      .take__statement-title {
        margin: 0 0 6px;
        font-size: 1.05rem;
        font-weight: 600;
        color: #0f172a;
      }

      .take__statement-taskname {
        margin: 0 0 12px;
        font-size: 14px;
        line-height: 1.45;
        color: #334155;
      }

      .take__statement-h3 {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #64748b;
      }

      .take__statement-body {
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.5;
        color: #334155;
      }

      .take__statement-body--placeholder {
        white-space: normal;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #475569;
      }

      .take__bottom {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 260px;
        gap: 18px;
        align-items: stretch;
      }

      @media (max-width: 900px) {
        .take__bottom {
          grid-template-columns: 1fr;
        }
      }

      .take__editor-wrap {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fff;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
      }

      .take__editor-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 8px;
      }

      .take__editor {
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.45;
        color: #0f172a;
        background: #f8fafc;
        min-height: 280px;
        flex: 1 1 auto;
      }

      .take__editor--readonly {
        overflow: auto;
        max-height: min(70vh, 520px);
        white-space: pre-wrap;
        word-break: break-word;
        user-select: text;
        cursor: text;
      }

      .take__side {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fafbff;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        min-height: 320px;
      }

      .take__side--review .take__meta {
        margin-bottom: 0;
      }

      .take__meta {
        font-size: 16px;
        line-height: 1.65;
        color: #334155;
        margin-bottom: 16px;
        text-align: left;
        border-radius: 10px;
        border: 1px solid #d6dceb;
        background: #ffffff;
        padding: 14px 12px;
        min-height: 280px;
        flex: 1 1 auto;
      }

      .take__meta p {
        margin: 0 0 12px;
      }

      .take__meta p:last-child {
        margin-bottom: 0;
      }

      .take__meta-k {
        font-weight: 600;
        color: #0f172a;
        margin-right: 6px;
      }
    `,
  ],
})
/**
 * Компонент детального просмотра завершенного теста студентом.
 */
export class StudentCompletedTestReviewComponent implements OnInit {
  data: StudentCompletedTestReviewDto | null = null;
  /**
   * Список вопросов в порядке прохождения.
   */
  questionsOrdered: StudentCompletedQuestionReviewDto[] = [];
  loading = true;
  error = '';
  activeTaskIndex = 0;

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  /**
   * Загружает детальный просмотр завершенного теста.
   */
  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('testId');
    const id = raw != null ? Number(raw) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      this.loading = false;
      this.error = 'Некорректная ссылка.';
      return;
    }
    this.auth.getStudentCompletedTestReview(id).subscribe({
      next: (d) => {
        this.data = d;
        this.questionsOrdered = [...d.questions].sort((a, b) => a.sortOrder - b.sortOrder);
        const n = this.questionsOrdered.length;
        const tParam = this.route.snapshot.queryParamMap.get('t');
        let idx = tParam != null ? parseInt(tParam, 10) - 1 : 0;
        if (!Number.isFinite(idx) || idx < 0) idx = 0;
        if (n > 0 && idx >= n) idx = n - 1;
        this.activeTaskIndex = n > 0 ? idx : 0;
        if (n > 0 && (tParam == null || tParam === '')) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { t: this.activeTaskIndex + 1 },
            replaceUrl: true,
          });
        }
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) void this.router.navigateByUrl('/login');
        else if (err.status === 403) this.error = 'Доступ только для студентов.';
        else if (err.status === 404) this.error = 'Тест не найден или не завершён.';
        else this.error = 'Не удалось загрузить данные.';
      },
    });
  }

  /**
   * Возвращает текущий активный вопрос.
   */
  get currentQuestion(): StudentCompletedQuestionReviewDto | null {
    if (!this.questionsOrdered.length) return null;
    return this.questionsOrdered[this.activeTaskIndex] ?? null;
  }

  /**
   * Возвращает отображаемый номер активного задания.
   */
  get activeDisplayIndex(): number {
    return this.activeTaskIndex + 1;
  }

  /**
   * Переключает активное задание по индексу.
   */
  selectTask(i: number): void {
    if (!this.questionsOrdered.length) return;
    if (i < 0 || i >= this.questionsOrdered.length) return;
    this.activeTaskIndex = i;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { t: i + 1 },
      replaceUrl: true,
    });
  }

  /**
   * Проверяет, является ли условие служебным шаблоном.
   */
  isPlaceholderVariantHint(q: StudentCompletedQuestionReviewDto): boolean {
    if (!q.taskContent) return false;
    return q.taskContent.includes('Сформулируйте решение по условию преподавателя');
  }

  /**
   * Возвращает текст условия для отображения.
   */
  conditionDisplayText(q: StudentCompletedQuestionReviewDto): string {
    if (this.isPlaceholderVariantHint(q)) {
      return 'Полное условие в варианте не заполнено. Ориентируйтесь на название задачи выше и уточните формулировку у преподавателя.';
    }
    return q.taskContent || '—';
  }

  /**
   * Форматирует длительность в минуты и секунды.
   */
  formatDuration(totalSeconds: number): string {
    if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) return '—';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m === 0) return `${s} с`;
    return `${m} мин ${s.toString().padStart(2, '0')} с`;
  }

  /**
   * Форматирует длительность или возвращает прочерк.
   */
  formatDurationOrDash(seconds: number | null): string {
    if (seconds == null || !Number.isFinite(seconds)) return '—';
    return this.formatDuration(seconds);
  }
}
