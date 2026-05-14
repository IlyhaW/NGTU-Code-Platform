import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import {
  TestAnalyticsDto,
  TestAnalyticsQuestionColumnRow,
  TestAnalyticsStudentCellRow,
  TestAnalyticsStudentRow,
} from '../../api.types';

interface SelectedAnalyticsCell {
  student: TestAnalyticsStudentRow;
  question: TestAnalyticsQuestionColumnRow;
  cell: TestAnalyticsStudentCellRow;
}

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
        <a routerLink="/teacher" class="ta-header__home ta-header__home--solo" aria-label="На главную">⌂</a>
      </header>

      <div class="ta-msg ta-msg--err" *ngIf="error">{{ error }}</div>
      <div class="ta-loading" *ngIf="loading">Загрузка…</div>

      <main class="ta-main" *ngIf="data && !loading">
        <section class="ta-panel">
          <div class="ta-panel__head">
            <div>
              <h2 class="ta-panel__h">Сводная таблица выполнения</h2>
              <p class="ta-panel__lead">
                Строки — студенты, столбцы — задания. Плюс ставится, если решение зачтено,
                отправлено в срок и не превышен лимит попыток.
              </p>
            </div>
            <div class="ta-legend" aria-label="Обозначения">
              <span class="ta-legend__item"><span class="ta-mark ta-mark--pass">+</span> зачтено</span>
              <span class="ta-legend__item"><span class="ta-mark ta-mark--fail">−</span> не зачтено</span>
            </div>
          </div>

          <div class="ta-empty" *ngIf="data.questionColumns.length === 0">
            В этом тесте пока нет заданий.
          </div>
          <div class="ta-empty" *ngIf="data.questionColumns.length > 0 && data.studentRows.length === 0">
            В назначенных группах пока нет студентов.
          </div>

          <div class="ta-table-wrap" *ngIf="data.questionColumns.length > 0 && data.studentRows.length > 0">
            <table class="ta-table">
              <thead>
                <tr>
                  <th class="ta-table__student">Студент</th>
                  <th
                    *ngFor="let q of data.questionColumns"
                    class="ta-table__task"
                    [title]="q.assignmentName + ' — ' + q.taskName"
                  >
                    <span class="ta-table__task-num">№{{ q.sortOrder + 1 }}</span>
                    <span class="ta-table__task-name">{{ q.taskName }}</span>
                  </th>
                  <th class="ta-table__score">Оценка</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of data.studentRows">
                  <th class="ta-table__student ta-table__student--body">
                    <span class="ta-student-name">{{ row.fullName }}</span>
                    <span class="ta-student-group" *ngIf="row.groupName">{{ row.groupName }}</span>
                  </th>
                  <td *ngFor="let q of data.questionColumns; let i = index" class="ta-table__cell">
                    <button
                      *ngIf="row.cells[i] as cell"
                      type="button"
                      class="ta-cell-btn"
                      [class.ta-cell-btn--pass]="cell.passed"
                      [class.ta-cell-btn--fail]="!cell.passed"
                      (click)="selectCell(row, q, cell)"
                      [attr.aria-label]="cellLabel(row, q, cell)"
                    >
                      {{ cell.passed ? '+' : '−' }}
                    </button>
                  </td>
                  <td class="ta-table__score ta-table__score--body">{{ row.score }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <div class="ta-modal-backdrop" *ngIf="selected" (click)="closeDetails()"></div>
      <aside class="ta-details" *ngIf="selected" role="dialog" aria-modal="true">
        <button type="button" class="ta-details__close" (click)="closeDetails()" aria-label="Закрыть">×</button>
        <h2 class="ta-details__title">{{ selected.student.fullName }}</h2>
        <p class="ta-details__subtitle">
          Задание №{{ selected.question.sortOrder + 1 }}:
          {{ selected.question.taskName }}
        </p>

        <div class="ta-details__grid">
          <div>
            <span class="ta-details__label">Результат</span>
            <strong [class.ta-details__ok]="selected.cell.passed" [class.ta-details__bad]="!selected.cell.passed">
              {{ selected.cell.passed ? 'зачтено' : 'не зачтено' }}
            </strong>
          </div>
          <div>
            <span class="ta-details__label">Статус</span>
            <strong>{{ selected.cell.statusLabel || statusRu(selected.cell.solutionStatus) }}</strong>
          </div>
          <div>
            <span class="ta-details__label">Попытки</span>
            <strong>{{ selected.cell.attemptsUsed }} / {{ selected.cell.maxAttempts || '∞' }}</strong>
          </div>
          <div>
            <span class="ta-details__label">В срок</span>
            <strong>{{ selected.cell.onTime ? 'да' : 'нет' }}</strong>
          </div>
          <div>
            <span class="ta-details__label">Время на задание</span>
            <strong>{{ formatDuration(selected.cell.timeSpentSeconds) }}</strong>
          </div>
          <div>
            <span class="ta-details__label">Обновлено</span>
            <strong>{{ formatDateTime(selected.cell.updatedAt) }}</strong>
          </div>
        </div>

        <div class="ta-details__block">
          <div class="ta-details__label">Текст варианта</div>
          <pre class="ta-details__task">{{ selected.cell.taskContent || '—' }}</pre>
        </div>

        <div class="ta-details__block">
          <div class="ta-details__label">Решение студента</div>
          <pre class="ta-details__code">{{ selected.cell.content || '— (нет ответа)' }}</pre>
        </div>
      </aside>
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
      .ta-header__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.5em 0.85em;
        min-width: min(10em, 50vw);
        max-width: min(38em, 90vw);
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
        margin: 0 auto;
      }
      .ta-panel {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.65em;
        padding: 1em 1.1em 1.15em;
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
      }
      .ta-panel__head {
        display: flex;
        justify-content: space-between;
        gap: 1em;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-bottom: 0.85em;
      }
      .ta-panel__h {
        margin: 0 0 0.35em;
        font-size: 1.05em;
        font-weight: 700;
        color: #0f172a;
      }
      .ta-panel__lead {
        margin: 0;
        max-width: 64em;
        font-size: 0.88em;
        color: #64748b;
      }
      .ta-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45em;
        font-size: 0.82em;
        color: #475569;
      }
      .ta-legend__item {
        display: inline-flex;
        align-items: center;
        gap: 0.35em;
      }
      .ta-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.45em;
        height: 1.45em;
        border-radius: 999px;
        font-weight: 800;
      }
      .ta-mark--pass {
        color: #166534;
        background: #dcfce7;
        border: 1px solid #86efac;
      }
      .ta-mark--fail {
        color: #991b1b;
        background: #fee2e2;
        border: 1px solid #fecaca;
      }
      .ta-table-wrap {
        max-height: calc(100dvh - 210px);
        overflow: auto;
        border: 1px solid #e2e8f0;
        border-radius: 0.6em;
        background: #fff;
      }
      .ta-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        min-width: 760px;
      }
      .ta-table th,
      .ta-table td {
        border-right: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        padding: 0.55em 0.65em;
        vertical-align: middle;
        background: #fff;
      }
      .ta-table thead th {
        position: sticky;
        top: 0;
        z-index: 3;
        background: #f8fafc;
        color: #0f172a;
        font-size: 0.82em;
      }
      .ta-table__student {
        position: sticky;
        left: 0;
        z-index: 4;
        min-width: 15em;
        max-width: 22em;
        text-align: left;
      }
      .ta-table__student--body {
        z-index: 2;
        background: #fff;
      }
      .ta-table__task {
        min-width: 8.5em;
        max-width: 12em;
        text-align: center;
      }
      .ta-table__task-num,
      .ta-table__task-name,
      .ta-student-name,
      .ta-student-group {
        display: block;
      }
      .ta-table__task-num {
        font-weight: 800;
        margin-bottom: 0.15em;
      }
      .ta-table__task-name {
        font-size: 0.85em;
        color: #475569;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ta-student-name {
        color: #1e3a8a;
        font-size: 0.9em;
        font-weight: 700;
      }
      .ta-student-group {
        margin-top: 0.15em;
        color: #64748b;
        font-size: 0.78em;
        font-weight: 500;
      }
      .ta-table__cell {
        text-align: center;
      }
      .ta-cell-btn {
        width: 2.25em;
        height: 2.25em;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 1.05em;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
      }
      .ta-cell-btn--pass {
        background: #dcfce7;
        color: #166534;
        border-color: #86efac;
      }
      .ta-cell-btn--fail {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fecaca;
      }
      .ta-cell-btn:hover {
        filter: brightness(0.96);
        transform: translateY(-1px);
      }
      .ta-table__score {
        position: sticky;
        right: 0;
        z-index: 4;
        min-width: 5.5em;
        text-align: center;
        font-weight: 800;
      }
      .ta-table__score--body {
        z-index: 2;
        background: #fff;
        color: #0f172a;
      }
      .ta-empty {
        border: 1px dashed #cbd5e1;
        border-radius: 0.5em;
        background: #f8fafc;
        color: #64748b;
        padding: 0.8em;
        font-size: 0.88em;
      }
      .ta-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.28);
        z-index: 20;
      }
      .ta-details {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(760px, calc(100vw - 32px));
        max-height: min(760px, calc(100dvh - 32px));
        overflow: auto;
        z-index: 21;
        background: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 0.75em;
        box-shadow: 0 20px 48px rgba(15, 23, 42, 0.28);
        padding: 1em 1.1em 1.2em;
      }
      .ta-details__close {
        position: absolute;
        top: 0.6em;
        right: 0.7em;
        width: 2em;
        height: 2em;
        border: 0;
        border-radius: 999px;
        background: #f1f5f9;
        color: #334155;
        cursor: pointer;
        font-size: 1.1em;
      }
      .ta-details__title {
        margin: 0 2em 0.2em 0;
        font-size: 1.15em;
        color: #0f172a;
      }
      .ta-details__subtitle {
        margin: 0 2em 0.9em 0;
        color: #475569;
        font-size: 0.9em;
      }
      .ta-details__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.65em;
        margin-bottom: 0.9em;
      }
      .ta-details__grid > div {
        border: 1px solid #e2e8f0;
        border-radius: 0.55em;
        padding: 0.55em 0.65em;
        background: #f8fafc;
      }
      .ta-details__label {
        display: block;
        color: #64748b;
        font-size: 0.78em;
        font-weight: 700;
        margin-bottom: 0.2em;
      }
      .ta-details__ok {
        color: #166534;
      }
      .ta-details__bad {
        color: #991b1b;
      }
      .ta-details__block {
        margin-top: 0.7em;
      }
      .ta-details__task {
        margin: 0;
        padding: 0.75em 0.85em;
        border-radius: 0.55em;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #0f172a;
        font-family: inherit;
        font-size: 0.86em;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 260px;
        overflow: auto;
      }
      .ta-details__code {
        margin: 0;
        padding: 0.75em 0.85em;
        border-radius: 0.55em;
        border: 1px solid #e2e8f0;
        background: #0f172a;
        color: #e2e8f0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.82em;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 360px;
        overflow: auto;
      }
    `,
  ],
})
/**
 * Компонент аналитики теста для преподавателя.
 */
export class TestAnalyticsComponent implements OnInit {
  testId: number | null = null;
  data: TestAnalyticsDto | null = null;
  selected: SelectedAnalyticsCell | null = null;
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
   * Открывает подробности по выбранной ячейке матрицы.
   */
  selectCell(
    student: TestAnalyticsStudentRow,
    question: TestAnalyticsQuestionColumnRow,
    cell: TestAnalyticsStudentCellRow,
  ): void {
    this.selected = { student, question, cell };
  }

  /**
   * Закрывает подробности решения.
   */
  closeDetails(): void {
    this.selected = null;
  }

  /**
   * Возвращает пользователя к списку аналитики тестов.
   */
  goList(): void {
    void this.router.navigateByUrl('/teacher/analytics');
  }

  /**
   * Формирует подпись ячейки для screen reader.
   */
  cellLabel(
    student: TestAnalyticsStudentRow,
    question: TestAnalyticsQuestionColumnRow,
    cell: TestAnalyticsStudentCellRow,
  ): string {
    return `${student.fullName}, задание ${question.sortOrder + 1}: ${cell.passed ? 'зачтено' : 'не зачтено'}`;
  }

  /**
   * Форматирует длительность в секундах.
   */
  formatDuration(value: number | null): string {
    if (value == null || value < 0) return '—';
    const m = Math.floor(value / 60);
    const s = value % 60;
    if (m <= 0) return `${s} с`;
    return `${m} мин ${s} с`;
  }

  /**
   * Форматирует дату обновления ответа.
   */
  formatDateTime(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('ru-RU');
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
