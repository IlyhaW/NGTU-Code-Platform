import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { StudentTestDetailDto, StudentTestQuestionDto, TestAnswerCheckDto } from '../../api.types';

@Component({
  selector: 'app-student-test-take',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="take">
      <div *ngIf="loading" class="take__msg">Загрузка...</div>
      <div *ngIf="error" class="take__msg take__msg--error">{{ error }}</div>

      <ng-container *ngIf="test && !loading && !error">
        <header class="take__header">
          <div class="take__header-left">
            <a routerLink="/student/tests/current" class="take__home" aria-label="Назад">←</a>
            <div class="take__title-box">
              <h1 class="take__title">{{ test.name }}</h1>
            </div>
          </div>
          <a routerLink="/student" class="take__home take__home--right" aria-label="На главную">⌂</a>
        </header>

        <section class="take__task-head">
          <div class="take__header-center">
            <div class="take__pointer-box">
              {{ currentQuestion?.assignmentName ?? '—' }}. Задание {{ activeDisplayIndex }}
            </div>
            <div class="take__task-nav" *ngIf="test.questions.length > 0" role="tablist" aria-label="Номера заданий">
              <button
                *ngFor="let q of test.questions; let i = index"
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

        <section class="take__result" *ngIf="checkResult">
          <div class="take__result-head" [class.take__result-head--ok]="checkResult.verdict === 'AC'" [class.take__result-head--fail]="checkResult.verdict !== 'AC'">
            <span class="take__result-code">{{ checkResult.verdict }}</span>
            <span class="take__result-message">{{ checkResult.message }}</span>
          </div>
          <div class="take__result-meta">
            <span>Пройдено: {{ checkResult.passedCount }}/{{ checkResult.totalCount }}</span>
            <span>max time: {{ checkResult.maxTimeMs }} ms</span>
            <span>max memory: {{ checkResult.maxMemoryKb }} KB</span>
          </div>
          <div class="take__result-cases" *ngIf="checkResult.cases?.length">
            <div
              class="take__result-case"
              *ngFor="let c of checkResult.cases; let i = index"
              [class.take__result-case--ok]="c.passed"
              [class.take__result-case--fail]="!c.passed"
            >
              <div class="take__result-case-head">
                <span class="take__result-case-title">Тест {{ i + 1 }}</span>
                <span class="take__result-case-code">{{ c.verdict }}</span>
              </div>
              <div class="take__result-case-meta">time: {{ c.timeMs }} ms · memory: {{ c.memoryKb }} KB</div>
              <div class="take__result-case-msg">{{ c.message }}</div>
            </div>
          </div>
        </section>

        <div class="take__bottom" *ngIf="currentQuestion">
          <div class="take__editor-wrap">
            <label class="take__editor-label" for="code-area">Решение (Python)</label>
            <textarea
              id="code-area"
              class="take__editor"
              [(ngModel)]="codeDraft"
              spellcheck="false"
              autocomplete="off"
              rows="18"
            ></textarea>
          </div>
          <section class="take__judge-info">
            <h3 class="take__judge-info-title">Формат и ограничения</h3>
            <div class="take__judge-info-block" *ngIf="currentQuestion?.inputFormat; else noInputFormat">
              <div class="take__judge-info-k">Входные данные</div>
              <div class="take__judge-info-v">{{ currentQuestion?.inputFormat }}</div>
            </div>
            <ng-template #noInputFormat>
              <div class="take__judge-info-block">
                <div class="take__judge-info-k">Входные данные</div>
                <div class="take__judge-info-v take__judge-info-v--muted">Не указано преподавателем</div>
              </div>
            </ng-template>

            <div class="take__judge-info-block" *ngIf="currentQuestion?.outputFormat; else noOutputFormat">
              <div class="take__judge-info-k">Выходные данные</div>
              <div class="take__judge-info-v">{{ currentQuestion?.outputFormat }}</div>
            </div>
            <ng-template #noOutputFormat>
              <div class="take__judge-info-block">
                <div class="take__judge-info-k">Выходные данные</div>
                <div class="take__judge-info-v take__judge-info-v--muted">Не указано преподавателем</div>
              </div>
            </ng-template>

            <div class="take__judge-info-limits">
              <div class="take__judge-info-limit">
                <span class="take__judge-info-k">Лимит времени:</span>
                <span class="take__judge-info-v">{{ judgeTimeLabel }}</span>
              </div>
              <div class="take__judge-info-limit">
                <span class="take__judge-info-k">Лимит памяти:</span>
                <span class="take__judge-info-v">{{ judgeMemoryLabel }}</span>
              </div>
            </div>
            <div class="take__judge-visible" *ngIf="currentQuestion?.openTestCases?.length">
              <div class="take__judge-visible-title">Открытые тест-кейсы</div>
              <div class="take__judge-visible-list">
                <div class="take__judge-visible-item" *ngFor="let c of currentQuestion?.openTestCases; let i = index">
                  <div class="take__judge-visible-n">Кейс {{ i + 1 }}</div>
                  <div class="take__judge-visible-row">
                    <span class="take__judge-visible-k">Вход:</span>
                    <span class="take__judge-visible-v">{{ c.inputData || '(пусто)' }}</span>
                  </div>
                  <div class="take__judge-visible-row">
                    <span class="take__judge-visible-k">Выход:</span>
                    <span class="take__judge-visible-v">{{ c.expectedOutput || '(пусто)' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <aside class="take__side">
            <div class="take__meta">
              <p>
                <span class="take__meta-k">Оставшееся время:</span>
                {{ remainingTimeLabel }}
              </p>
              <p>
                <span class="take__meta-k">Количество попыток:</span>
                {{ attemptsLabel }}
              </p>
              <p>
                <span class="take__meta-k">Состояние:</span>
                {{ statusLabel }}
              </p>
            </div>
            <div class="take__actions">
              <button
                type="button"
                class="take__btn"
                (click)="checkAnswer()"
                [disabled]="checking || saving || !currentQuestion?.testQuestionId"
              >
                {{ checking ? 'Проверка…' : 'Проверить' }}
              </button>
              <button
                type="button"
                class="take__btn"
                (click)="saveAnswer()"
                [disabled]="saving || !currentQuestion?.testQuestionId"
              >
                {{ saving ? 'Сохранение…' : 'Сохранить ответ' }}
              </button>
              <p *ngIf="saveMessage" class="take__save-hint" [class.take__save-hint--error]="saveFeedbackError">
                {{ saveMessage }}
              </p>
              <button
                *ngIf="!isLastTask"
                type="button"
                class="take__btn"
                (click)="nextTask()"
              >
                Следующее задание
              </button>
              <button
                *ngIf="isLastTask"
                type="button"
                class="take__btn"
                (click)="finishTest()"
                [disabled]="finishing || saving"
              >
                {{ finishing ? 'Завершение…' : 'Завершить тест' }}
              </button>
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
      .take__result {
        margin-bottom: 16px;
        border: 1px solid #d1d5e6;
        border-radius: 12px;
        background: #fff;
        padding: 12px 14px;
      }
      .take__result-head {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        line-height: 1.4;
        margin-bottom: 8px;
      }
      .take__result-head--ok { color: #166534; }
      .take__result-head--fail { color: #991b1b; }
      .take__result-code {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 52px;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid currentColor;
        font-weight: 700;
        font-size: 14px;
      }
      .take__result-message { font-weight: 600; }
      .take__result-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        font-size: 13px;
        color: #475569;
      }
      .take__result-cases {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 190px;
        overflow: auto;
      }
      .take__result-case {
        border: 1px solid #d1d5e6;
        border-radius: 10px;
        padding: 8px 10px;
        background: #f8fafc;
      }
      .take__result-case--ok { border-color: #86efac; background: #f0fdf4; }
      .take__result-case--fail { border-color: #fecaca; background: #fef2f2; }
      .take__result-case-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 3px; }
      .take__result-case-title { font-size: 13px; font-weight: 600; color: #0f172a; }
      .take__result-case-code { font-size: 12px; font-weight: 700; }
      .take__result-case-meta { font-size: 12px; color: #64748b; margin-bottom: 3px; }
      .take__result-case-msg { font-size: 13px; color: #334155; white-space: pre-wrap; }

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
        grid-template-columns: minmax(0, 1fr) minmax(240px, 0.6fr) 260px;
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

      .take__judge-info {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fff;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 320px;
      }

      .take__judge-info-title {
        margin: 0;
        font-size: 0.95em;
        font-weight: 600;
        color: #0f172a;
      }

      .take__judge-info-block {
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        padding: 8px 10px;
      }

      .take__judge-info-k {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #64748b;
      }

      .take__judge-info-v {
        white-space: pre-wrap;
        font-size: 13px;
        line-height: 1.45;
        color: #334155;
      }

      .take__judge-info-v--muted {
        color: #94a3b8;
      }

      .take__judge-info-limits {
        margin-top: auto;
        border-top: 1px solid #e2e8f0;
        padding-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .take__judge-visible {
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .take__judge-visible-title { font-size: 0.72em; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; }
      .take__judge-visible-list { display: flex; flex-direction: column; gap: 4px; max-height: 120px; overflow: auto; }
      .take__judge-visible-item { border: 1px solid #e2e8f0; border-radius: 7px; background: #f8fafc; padding: 5px 7px; }
      .take__judge-visible-n { font-size: 0.72em; font-weight: 600; color: #475569; margin-bottom: 2px; }
      .take__judge-visible-row { display: grid; grid-template-columns: 2.9em 1fr; gap: 4px; margin-bottom: 1px; }
      .take__judge-visible-row:last-child { margin-bottom: 0; }
      .take__judge-visible-k { font-size: 0.68em; color: #94a3b8; text-transform: uppercase; }
      .take__judge-visible-v { white-space: pre-wrap; font-size: 0.72em; color: #475569; line-height: 1.25; }

      .take__judge-info-limit {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #fafbff;
        padding: 8px 10px;
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
        resize: vertical;
        min-height: 280px;
        flex: 1 1 auto;
      }

      .take__editor:focus {
        outline: none;
        border-color: #93c5fd;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
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

      .take__meta {
        font-size: 16px;
        line-height: 1.65;
        color: #334155;
        margin-bottom: 16px;
        text-align: left;
        border-radius: 10px;
        border: 1px solid #d6dceb;
        background: #ffffff;
        padding: 10px 12px;
        min-height: 0;
        flex: 0 0 auto;
      }

      .take__meta p {
        margin: 0 0 8px;
      }
      .take__meta p:last-child { margin-bottom: 0; }

      .take__meta-k {
        font-weight: 600;
        color: #0f172a;
        margin-right: 6px;
      }

      .take__actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .take__btn {
        width: 100%;
        padding: 0.65em 1em;
        border-radius: 0.55em;
        border: 0;
        background: #a5c8ff;
        color: #1e3a5f;
        font-size: 1em;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s, opacity 0.15s;
      }

      .take__btn:hover:not(:disabled) {
        background: #8bb8ff;
      }

      .take__btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .take__save-hint {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: #15803d;
        text-align: center;
      }

      .take__save-hint--error {
        color: #b91c1c;
      }

    `,
  ],
})
/**
 * Компонент прохождения теста студентом.
 */
export class StudentTestTakeComponent implements OnInit {
  test: StudentTestDetailDto | null = null;
  private testId: number | null = null;
  loading = true;
  error = '';
  saveMessage = '';
  saveFeedbackError = false;
  saving = false;
  checking = false;
  finishing = false;
  checkResult: TestAnswerCheckDto | null = null;

  activeTaskIndex = 0;
  codeDraft = '';
  private readonly codeByTask = new Map<number, string>();
  private readonly defaultCode = `def solve():
    # TODO: прочитайте входные данные и выведите ответ
    pass

if __name__ == "__main__":
    solve()
`;

  private saveMessageTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Накопленное время работы по задачам в секундах.
   */
  private readonly taskAccumulatedSeconds = new Map<number, number>();
  private activeTaskEnteredAt: number | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  /**
   * Инициализирует страницу прохождения теста и загружает данные.
   */
  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('testId');
    const testId = rawId != null ? Number(rawId) : NaN;
    if (!Number.isFinite(testId)) {
      this.loading = false;
      this.error = 'Некорректная ссылка на тест.';
      return;
    }

    this.auth.getStudentTestDetail(testId).subscribe({
      next: (data) => {
        this.codeByTask.clear();
        this.test = data;
        this.testId = data.id;
        this.loadDraftsFromStorage(data.id);
        for (const q of data.questions) {
          if (q.savedAnswer != null) {
            this.codeByTask.set(q.sortOrder, q.savedAnswer);
          }
        }
        const n = data.questions.length;
        const tParam = this.route.snapshot.queryParamMap.get('t');
        let idx = tParam != null ? parseInt(tParam, 10) - 1 : 0;
        if (!Number.isFinite(idx) || idx < 0) idx = 0;
        if (n > 0 && idx >= n) idx = n - 1;
        this.activeTaskIndex = n > 0 ? idx : 0;
        this.syncCodeDraftForIndex();
        if (n > 0 && (tParam == null || tParam === '')) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { t: this.activeTaskIndex + 1 },
            replaceUrl: true,
          });
        }
        this.activeTaskEnteredAt = Date.now();
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) this.router.navigateByUrl('/login');
        else if (err.status === 403) this.error = 'Доступ только для студентов.';
        else if (err.status === 404) this.error = 'Тест не найден или сейчас недоступен.';
        else this.error = 'Не удалось загрузить тест.';
      },
    });
  }

  /**
   * Возвращает текущий активный вопрос теста.
   */
  get currentQuestion(): StudentTestQuestionDto | null {
    if (!this.test?.questions.length) return null;
    return this.test.questions[this.activeTaskIndex] ?? null;
  }

  /**
   * Возвращает отображаемый номер активного задания.
   */
  get activeDisplayIndex(): number {
    return this.activeTaskIndex + 1;
  }

  /**
   * Возвращает отображаемое оставшееся время теста.
   */
  get remainingTimeLabel(): string {
    if (this.test?.totalTimeMinutes != null && this.test.totalTimeMinutes > 0) {
      return '—:—';
    }
    return 'не ограничено';
  }

  /**
   * Возвращает счетчик использованных и доступных попыток.
   */
  get attemptsLabel(): string {
    const m = this.currentQuestion?.maxAttempts;
    if (m == null) return '—';
    const used = this.currentQuestion?.attemptsUsed ?? 0;
    return `${used}/${m}`;
  }

  /**
   * Возвращает статус текущего задания.
   */
  get statusLabel(): string {
    return this.currentQuestion?.statusLabel || 'не сдано';
  }

  /**
   * Возвращает строку лимита времени проверки.
   */
  get judgeTimeLabel(): string {
    const ms = this.currentQuestion?.judgeTimeLimitMs;
    if (!ms || ms <= 0) return 'по умолчанию';
    const sec = ms / 1000;
    return Number.isInteger(sec) ? `${sec} сек` : `${sec.toFixed(2)} сек`;
  }

  /**
   * Возвращает строку лимита памяти проверки.
   */
  get judgeMemoryLabel(): string {
    const kb = this.currentQuestion?.judgeMemoryLimitKb;
    if (!kb || kb <= 0) return 'по умолчанию';
    const mb = kb / 1024;
    return Number.isInteger(mb) ? `${mb} МБ` : `${mb.toFixed(1)} МБ`;
  }

  /**
   * Проверяет, является ли текст условия служебным шаблоном.
   */
  isPlaceholderVariantHint(q: StudentTestQuestionDto | null): boolean {
    if (!q?.taskContent) return false;
    return q.taskContent.includes('Сформулируйте решение по условию преподавателя');
  }

  /**
   * Возвращает текст условия для отображения студенту.
   */
  conditionDisplayText(q: StudentTestQuestionDto | null): string {
    if (!q) return '';
    if (this.isPlaceholderVariantHint(q)) {
      return 'Полное условие в варианте не заполнено. Ориентируйтесь на название задачи выше и уточните формулировку у преподавателя.';
    }
    return q.taskContent || 'Текст условия не задан в варианте задачи.';
  }

  /**
   * Проверяет, что открыто последнее задание теста.
   */
  get isLastTask(): boolean {
    const n = this.test?.questions.length ?? 0;
    if (n === 0) return false;
    return this.activeTaskIndex >= n - 1;
  }

  /**
   * Завершает тест и переводит пользователя в список завершенных тестов.
   */
  finishTest(): void {
    if (this.testId == null || !this.test?.questions.length) return;
    this.persistCurrentCode();
    this.flushTaskTime();
    this.saveDraftsToStorage(this.testId);
    const totalTimeSeconds = this.getTotalAccumulatedSeconds();
    this.finishing = true;
    this.saveMessage = '';
    this.auth.completeStudentTest(this.testId, { totalTimeSeconds }).subscribe({
      next: () => {
        this.finishing = false;
        void this.router.navigate(['/student/tests/completed']);
      },
      error: (err: HttpErrorResponse) => {
        this.finishing = false;
        if (err.status === 401) this.router.navigateByUrl('/login');
        else {
          this.saveFeedbackError = true;
          this.saveMessage =
            err.status === 404
              ? 'Нельзя завершить тест (недоступен или уже завершён).'
              : 'Не удалось завершить тест. Попробуйте ещё раз.';
          this.flashSaveMessage();
        }
      },
    });
  }

  /**
   * Сохраняет текущий ответ студента на сервере.
   */
  saveAnswer(): void {
    if (this.testId == null || !this.test?.questions.length) return;
    const q = this.currentQuestion;
    if (!q?.testQuestionId) return;
    this.persistCurrentCode();
    this.flushTaskTime();
    const timeSpentSeconds = this.taskAccumulatedSeconds.get(q.sortOrder) ?? 0;
    this.saving = true;
    this.saveMessage = '';
    this.saveFeedbackError = false;
    this.auth
      .saveStudentTestAnswer(this.testId, {
        testQuestionId: q.testQuestionId,
        content: this.codeDraft,
        timeSpentSeconds,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          q.savedAnswer = this.codeDraft;
          q.attemptsUsed = (q.attemptsUsed ?? 0) + 1;
          this.saveDraftsToStorage(this.testId!);
          this.saveMessage = 'Ответ сохранён на сервере';
          this.saveFeedbackError = false;
          this.flashSaveMessage();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.saveFeedbackError = true;
          if (err.status === 401) this.router.navigateByUrl('/login');
          else if (err.status === 404) this.saveMessage = 'Не удалось сохранить: тест недоступен.';
          else if (err.status === 400) this.saveMessage = 'Попытки исчерпаны или ответ некорректен.';
          else this.saveMessage = 'Ошибка сохранения. Попробуйте ещё раз.';
          this.flashSaveMessage();
        },
      });
  }

  /**
   * Запускает проверку текущего ответа студента.
   */
  checkAnswer(): void {
    if (this.testId == null || !this.test?.questions.length) return;
    const q = this.currentQuestion;
    if (!q?.testQuestionId) return;
    this.persistCurrentCode();
    this.flushTaskTime();
    this.checking = true;
    this.saveMessage = '';
    this.saveFeedbackError = false;
    this.checkResult = null;
    const timeSpentSeconds = this.taskAccumulatedSeconds.get(q.sortOrder) ?? 0;
    this.auth
      .saveStudentTestAnswer(this.testId, {
        testQuestionId: q.testQuestionId,
        content: this.codeDraft,
        timeSpentSeconds,
      })
      .subscribe({
        next: () => {
          q.savedAnswer = this.codeDraft;
          q.attemptsUsed = (q.attemptsUsed ?? 0) + 1;
          this.auth
            .checkStudentTestAnswer(this.testId!, q.testQuestionId)
            .subscribe({
              next: (res) => {
                this.checking = false;
                this.checkResult = res;
                q.solutionStatus = res.verdict === 'AC' ? 'graded_pass' : 'graded_fail';
                q.statusLabel = res.verdict === 'AC' ? 'сдано' : 'не сдано';
                this.saveMessage = `Проверка завершена: ${res.verdict}`;
                this.saveFeedbackError = res.verdict !== 'AC';
                this.flashSaveMessage();
              },
              error: (err: HttpErrorResponse) => {
                this.checking = false;
                this.saveFeedbackError = true;
                if (err.status === 401) this.router.navigateByUrl('/login');
                else if (err.status === 404) this.saveMessage = 'Проверка недоступна: тест или кейсы не найдены.';
                else this.saveMessage = 'Не удалось выполнить проверку.';
                this.flashSaveMessage();
              },
            });
        },
        error: (err: HttpErrorResponse) => {
          this.checking = false;
          this.saveFeedbackError = true;
          if (err.status === 401) this.router.navigateByUrl('/login');
          else if (err.status === 404) this.saveMessage = 'Не удалось сохранить перед проверкой.';
          else if (err.status === 400) this.saveMessage = 'Попытки исчерпаны или код некорректен.';
          else this.saveMessage = 'Не удалось подготовить проверку.';
          this.flashSaveMessage();
        },
      });
  }

  /**
   * Отображает временное сообщение об операции.
   */
  private flashSaveMessage(): void {
    if (this.saveMessageTimer !== undefined) {
      clearTimeout(this.saveMessageTimer);
    }
    this.saveMessageTimer = setTimeout(() => {
      this.saveMessage = '';
      this.saveMessageTimer = undefined;
    }, 4000);
  }

  /**
   * Переключает активное задание по индексу.
   */
  selectTask(i: number): void {
    if (!this.test?.questions.length) return;
    if (i < 0 || i >= this.test.questions.length) return;
    this.persistCurrentCode();
    this.flushTaskTime();
    this.activeTaskIndex = i;
    this.syncCodeDraftForIndex();
    this.checkResult = null;
    this.activeTaskEnteredAt = Date.now();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { t: i + 1 },
      replaceUrl: true,
    });
  }

  /**
   * Переходит к следующему заданию.
   */
  nextTask(): void {
    if (!this.test?.questions.length) return;
    this.persistCurrentCode();
    const n = this.test.questions.length;
    const next = (this.activeTaskIndex + 1) % n;
    this.selectTask(next);
  }

  /**
   * Сохраняет текущий черновик кода для активного задания.
   */
  private persistCurrentCode(): void {
    const q = this.currentQuestion;
    if (q) this.codeByTask.set(q.sortOrder, this.codeDraft);
  }

  /**
   * Обновляет накопленное время активного задания.
   */
  private flushTaskTime(): void {
    const q = this.currentQuestion;
    if (!q || this.activeTaskEnteredAt == null) return;
    const delta = Math.max(0, Math.floor((Date.now() - this.activeTaskEnteredAt) / 1000));
    const prev = this.taskAccumulatedSeconds.get(q.sortOrder) ?? 0;
    this.taskAccumulatedSeconds.set(q.sortOrder, prev + delta);
    this.activeTaskEnteredAt = Date.now();
  }

  /**
   * Возвращает суммарное накопленное время по всем заданиям.
   */
  private getTotalAccumulatedSeconds(): number {
    let sum = 0;
    this.taskAccumulatedSeconds.forEach((v) => {
      sum += v;
    });
    return sum;
  }

  /**
   * Синхронизирует черновик редактора с активным заданием.
   */
  private syncCodeDraftForIndex(): void {
    const q = this.currentQuestion;
    if (!q) {
      this.codeDraft = '';
      return;
    }
    const fromDraft = this.codeByTask.get(q.sortOrder);
    if (fromDraft !== undefined) {
      this.codeDraft = fromDraft;
      return;
    }
    this.codeDraft = q.savedAnswer != null ? q.savedAnswer : this.defaultCode;
  }

  /**
   * Формирует ключ localStorage для черновиков теста.
   */
  private storageKey(id: number): string {
    return `studentTestDraft:${id}`;
  }

  /**
   * Загружает черновики кода из localStorage.
   */
  private loadDraftsFromStorage(id: number): void {
    try {
      const raw = localStorage.getItem(this.storageKey(id));
      if (!raw) return;
      const obj = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) {
        const ord = Number(k);
        if (Number.isFinite(ord) && typeof v === 'string') {
          this.codeByTask.set(ord, v);
        }
      }
    } catch {
      /* Некорректные данные localStorage игнорируются. */
    }
  }

  /**
   * Сохраняет черновики кода в localStorage.
   */
  private saveDraftsToStorage(id: number): void {
    const obj: Record<string, string> = {};
    this.codeByTask.forEach((code, sortOrder) => {
      obj[String(sortOrder)] = code;
    });
    localStorage.setItem(this.storageKey(id), JSON.stringify(obj));
  }
}
