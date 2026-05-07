import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { TestAnalyticsDto } from '../../api.types';

@Component({
  selector: 'app-test-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ta-layout">
      <header class="ta-header">
        <div class="ta-header__left">
          <button type="button" class="ta-header__home" (click)="goList()" aria-label="Назад">←</button>
          <div class="ta-header__title-box" *ngIf="data">
            <h1 class="ta-header__title">{{ data.testName }}</h1>
            <span class="ta-header__badge">{{ statusRu(data.status) }}</span>
          </div>
        </div>
        <div class="ta-header__actions" *ngIf="testId != null">
          <a routerLink="/teacher" class="ta-header__home ta-header__home--solo" aria-label="На главную">⌂</a>
        </div>
      </header>

      <div class="ta-msg ta-msg--err" *ngIf="error">{{ error }}</div>
      <div class="ta-loading" *ngIf="loading">Загрузка…</div>

      <main class="ta-main" *ngIf="data && !loading">
        <section class="ta-two-col">
          <article class="ta-panel ta-panel--tasks">
            <h2 class="ta-panel__h">Задания теста</h2>
            <div class="ta-task-list" *ngIf="data.questions.length; else noQuestions">
              <div class="ta-task-row" *ngFor="let q of data.questions">
                <div class="ta-task-row__head">
                  <span class="ta-task-row__idx">№{{ q.sortOrder + 1 }}</span>
                  <span class="ta-task-row__title">{{ q.taskName }}</span>
                </div>
                <div class="ta-task-row__stats">
                  <span class="ta-chip ta-chip--pass">Сдано: {{ q.passedCount }}</span>
                  <span class="ta-chip ta-chip--fail">Не сдано: {{ q.failedCount }}</span>
                  <span class="ta-chip ta-chip--skip">Пропуски: {{ q.skippedCount }}</span>
                </div>
                <div class="ta-task-row__actions" *ngIf="testId != null">
                  <a
                    class="ta-link ta-link--inline"
                    [routerLink]="['/teacher/tests', testId, 'submissions']"
                    [queryParams]="{ testQuestionId: q.testQuestionId }"
                  >
                    Ответы студентов
                  </a>
                </div>
              </div>
            </div>
            <ng-template #noQuestions>
              <div class="ta-empty">В этом тесте пока нет заданий.</div>
            </ng-template>
          </article>

          <article class="ta-panel ta-panel--graph">
            <h2 class="ta-panel__h">График выполнения</h2>
            <p class="ta-panel__lead">Процент сданных решений по каждому заданию.</p>
            <div class="ta-bars" *ngIf="data.questions.length">
              <div class="ta-bar-row" *ngFor="let q of data.questions">
                <div class="ta-bar-row__label">№{{ q.sortOrder + 1 }}</div>
                <div class="ta-bar-row__track">
                  <div class="ta-bar-row__fill" [style.width.%]="pct(q.passedCount, data.totalStudentsInGroups)"></div>
                </div>
                <div class="ta-bar-row__val">{{ pct(q.passedCount, data.totalStudentsInGroups).toFixed(0) }}%</div>
              </div>
            </div>
            <div class="ta-empty" *ngIf="!data.questions.length">Нет данных для графика.</div>
          </article>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      .ta-layout {
        box-sizing: border-box;
        min-height: 100dvh;
        padding: 16px 20px 28px;
        font-size: clamp(15px, 0.55vw + 13px, 18px);
        line-height: 1.45;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
      }
      .ta-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 1em;
      }
      .ta-header__left {
        display: flex;
        align-items: center;
        gap: 0.6em;
        min-width: 0;
        flex: 1 1 auto;
      }
      .ta-header__home {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.75em;
        height: 2.75em;
        border-radius: 0.55em;
        background: #fff;
        border: 1px solid #d1d5e6;
        color: #374151;
        font-size: 1.1em;
        flex-shrink: 0;
        padding: 0;
        cursor: pointer;
        font-family: inherit;
        text-decoration: none;
      }
      .ta-header__home:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }
      .ta-header__home--solo {
        margin-left: 0;
      }
      .ta-header__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.5em 0.85em;
        min-width: min(10em, 50vw);
        max-width: min(32em, 90vw);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5em 0.75em;
      }
      .ta-header__title {
        margin: 0;
        font-size: 1.15em;
        font-weight: 600;
        color: #111827;
      }
      .ta-header__badge {
        font-size: 0.78em;
        font-weight: 600;
        padding: 0.2em 0.55em;
        border-radius: 999px;
        background: #e0e7ff;
        color: #312e81;
      }
      .ta-header__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5em 0.75em;
      }
      .ta-link {
        padding: 0.45em 0.75em;
        border-radius: 0.5em;
        border: 1px solid #93c5fd;
        background: #eff6ff;
        color: #1e40af;
        font-weight: 600;
        font-size: 0.88em;
        text-decoration: none;
      }
      .ta-link:hover {
        filter: brightness(0.97);
      }
      .ta-msg--err {
        padding: 0.65em 0.9em;
        border-radius: 0.5em;
        background: #fee2e2;
        color: #991b1b;
        margin-bottom: 0.75em;
      }
      .ta-loading {
        color: #64748b;
      }
      .ta-main {
        width: 100%;
        max-width: none;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.25em;
      }
      .ta-two-col { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 1em; min-height: 0; }
      @media (max-width: 980px) { .ta-two-col { grid-template-columns: 1fr; } }
      .ta-panel {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.65em;
        padding: 1em 1.1em 1.15em;
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
      }
      .ta-panel--tasks, .ta-panel--graph { min-height: 0; display: flex; flex-direction: column; }
      .ta-panel__h {
        margin: 0 0 0.35em;
        font-size: 1.05em;
        font-weight: 700;
        color: #0f172a;
      }
      .ta-panel__lead {
        margin: 0 0 1em;
        font-size: 0.88em;
        color: #64748b;
      }
      .ta-task-list { display: flex; flex-direction: column; gap: 0.65em; overflow: auto; min-height: 0; }
      .ta-task-row { border: 1px solid #e2e8f0; border-radius: 0.5em; background: #f8fafc; padding: 0.55em 0.65em; }
      .ta-task-row__head { display: flex; align-items: center; gap: 0.45em; margin-bottom: 0.4em; }
      .ta-task-row__idx { font-weight: 700; color: #1e293b; font-size: 0.84em; }
      .ta-task-row__title { color: #334155; font-size: 0.88em; }
      .ta-task-row__stats { display: flex; flex-wrap: wrap; gap: 0.4em; }
      .ta-task-row__actions { margin-top: 0.5em; }
      .ta-chip { font-size: 0.78em; padding: 0.22em 0.5em; border-radius: 999px; border: 1px solid transparent; font-weight: 600; }
      .ta-chip--pass { background: #dcfce7; color: #166534; border-color: #86efac; }
      .ta-chip--fail { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
      .ta-chip--skip { background: #e2e8f0; color: #475569; border-color: #cbd5e1; }
      .ta-link--inline { display: inline-flex; }
      .ta-bars { display: flex; flex-direction: column; gap: 0.55em; margin-top: 0.1em; }
      .ta-bar-row { display: grid; grid-template-columns: 2.3em 1fr 2.8em; gap: 0.45em; align-items: center; }
      .ta-bar-row__label { font-size: 0.8em; color: #334155; font-weight: 600; }
      .ta-bar-row__track { height: 0.8em; border-radius: 999px; background: #f1f5f9; border: 1px solid #e2e8f0; overflow: hidden; }
      .ta-bar-row__fill { height: 100%; background: linear-gradient(90deg, #60a5fa, #2563eb); border-radius: 999px; }
      .ta-bar-row__val { font-size: 0.78em; text-align: right; color: #475569; font-weight: 600; }
      .ta-empty { border: 1px dashed #cbd5e1; border-radius: 0.5em; background: #f8fafc; color: #64748b; padding: 0.8em; font-size: 0.88em; }
    `,
  ],
})
/**
 * Компонент аналитики теста для преподавателя.
 */
export class TestAnalyticsComponent implements OnInit {
  testId: number | null = null;
  data: TestAnalyticsDto | null = null;
  loading = true;
  error = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  /**
   * Инициализирует страницу и загружает аналитику теста.
   */
  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('testId');
    const id = raw != null ? Number(raw) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      this.loading = false;
      this.error = 'Некорректная ссылка.';
      return;
    }
    this.testId = id;
    this.auth.getTestAnalytics(id).subscribe({
      next: (d) => {
        this.data = d;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) void this.router.navigateByUrl('/login');
        else if (err.status === 403) this.error = 'Доступ только для преподавателя.';
        else if (err.status === 404) this.error = 'Тест не найден.';
        else this.error = 'Не удалось загрузить аналитику.';
      },
    });
  }

  /**
   * Возвращает пользователя к списку аналитики тестов.
   */
  goList(): void {
    void this.router.navigateByUrl('/teacher/analytics');
  }

  /**
   * Вычисляет процент значения от общего количества.
   */
  pct(part: number, whole: number): number {
    if (whole <= 0) return 0;
    return Math.min(100, (100 * part) / whole);
  }

  /**
   * Преобразует код статуса в русскую подпись.
   */
  statusRu(s: string): string {
    const m: Record<string, string> = {
      draft: 'Черновик',
      active: 'Активен',
      archived: 'В архиве',
      saved: 'Сохранён',
      awaiting_review: 'На проверке',
      none: 'Нет ответа',
      graded_pass: 'Зачёт',
      graded_fail: 'Не зачёт',
      unknown: 'Неизвестно',
    };
    return m[s] ?? s;
  }
}
