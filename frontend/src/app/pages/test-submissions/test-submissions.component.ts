import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { StudentTestSubmissionRowDto, TestSubmissionsDto } from '../../api.types';

@Component({
  selector: 'app-test-submissions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="submissions">
      <header class="submissions__header">
        <div class="submissions__header-left">
          <button type="button" class="submissions__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="submissions__title-box" *ngIf="data">
            <h1 class="submissions__title">{{ data.testName }}</h1>
          </div>
        </div>
        <a routerLink="/teacher" class="submissions__home submissions__home--solo" aria-label="На главную">⌂</a>
      </header>

      <div *ngIf="loading" class="submissions__msg">Загрузка…</div>
      <div *ngIf="error" class="submissions__msg submissions__msg--error">{{ error }}</div>

      <ng-container *ngIf="data && !loading && !error">
        <div *ngIf="filteredStudents.length === 0" class="submissions__empty">Нет студентов в назначенных группах.</div>

        <section *ngFor="let row of filteredStudents" class="submissions__student">
          <h2 class="submissions__student-name">{{ row.fullName }}</h2>
          <div *ngFor="let a of row.answers; let i = index" class="submissions__answer">
            <div class="submissions__answer-head">
              <span class="submissions__answer-num">Задание {{ i + 1 }}</span>
              <span class="submissions__answer-meta">{{ a.assignmentName }} — {{ a.taskName }}</span>
            </div>
            <div class="submissions__answer-stats">
              <span class="submissions__chip">Попытки: {{ a.attemptsUsed }}</span>
              <span class="submissions__chip submissions__chip--status">{{ a.statusLabel || a.solutionStatus || '—' }}</span>
            </div>
            <div class="submissions__block">
              <div class="submissions__block-title">Текст задачи</div>
              <pre class="submissions__code">{{ a.taskContent || '—' }}</pre>
            </div>
            <div class="submissions__block">
              <div class="submissions__block-title">Текст решения</div>
              <pre class="submissions__code">{{ a.content || '— (нет ответа)' }}</pre>
            </div>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [
    `
      :host { display: block; box-sizing: border-box; min-height: 100vh; min-height: 100dvh; padding: 16px 20px 28px; background: radial-gradient(circle at top left, #eef1ff, #e7eaef); }
      .submissions { width: 100%; max-width: none; margin: 0 auto; font-size: clamp(15px, 0.55vw + 13px, 18px); }

      .submissions__header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75em;
        margin-bottom: 1em;
      }

      .submissions__header-left {
        display: flex;
        align-items: center;
        gap: 0.6em;
        min-width: 0;
        flex: 1 1 auto;
      }

      .submissions__home {
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
      .submissions__home:hover { background: #f5f6fb; border-color: #b2b9ee; }
      .submissions__home--solo { margin-left: auto; }
      .submissions__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.5em 0.85em;
        min-width: min(10em, 50vw);
        max-width: min(32em, 90vw);
      }

      .submissions__title {
        margin: 0;
        font-size: 1.15em;
        font-weight: 600;
        color: #111827;
      }
      .submissions__msg { font-size: 0.88em; color: #64748b; }
      .submissions__msg--error { color: #b91c1c; }
      .submissions__lead { margin: 0 0 0.7em; font-size: 0.9em; color: #64748b; }

      .submissions__empty {
        padding: 1em;
        border-radius: 0.65em;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        color: #64748b;
        font-size: 0.88em;
      }

      .submissions__student {
        margin-bottom: 0.9em;
        padding: 0.9em 1em;
        border-radius: 0.65em;
        background: #ffffff;
        border: 1px solid #d1d5e6;
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
      }

      .submissions__student-name {
        margin: 0 0 0.75em;
        font-size: 1.02em;
        font-weight: 600;
        color: #1e3a8a;
      }

      .submissions__answer { margin-bottom: 0.75em; border: 1px solid #e2e8f0; border-radius: 0.55em; background: #f8fafc; padding: 0.65em; }
      .submissions__answer:last-child { margin-bottom: 0; }

      .submissions__answer-head {
        display: flex;
        flex-direction: column;
        gap: 0.2em;
        margin-bottom: 0.45em;
      }

      .submissions__answer-num {
        font-size: 0.8em;
        font-weight: 600;
        color: #0f172a;
      }

      .submissions__answer-meta {
        font-size: 0.76em;
        color: #64748b;
      }
      .submissions__answer-stats { display: flex; flex-wrap: wrap; gap: 0.4em; margin-bottom: 0.5em; }
      .submissions__chip { font-size: 0.75em; font-weight: 600; padding: 0.2em 0.48em; border-radius: 999px; background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; }
      .submissions__chip--status { background: #e0e7ff; color: #312e81; border-color: #c7d2fe; }
      .submissions__block { margin-bottom: 0.5em; }
      .submissions__block:last-child { margin-bottom: 0; }
      .submissions__block-title { margin: 0 0 0.25em; font-size: 0.76em; font-weight: 700; color: #334155; }

      .submissions__code {
        margin: 0;
        padding: 0.6em 0.7em;
        border-radius: 0.45em;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.78em;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
        color: #0f172a;
        max-height: 220px;
        overflow: auto;
      }
    `,
  ],
})
/**
 * Компонент просмотра отправок студентов по тесту.
 */
export class TestSubmissionsComponent implements OnInit {
  testId: number | null = null;
  data: TestSubmissionsDto | null = null;
  filteredStudents: StudentTestSubmissionRowDto[] = [];
  selectedQuestionId: number | null = null;
  selectedQuestionSortOrder: number | null = null;
  loading = true;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  /**
   * Инициализирует страницу и загружает отправки по тесту.
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
    const rawQuestionId = this.route.snapshot.queryParamMap.get('testQuestionId');
    const questionId = rawQuestionId != null ? Number(rawQuestionId) : NaN;
    this.selectedQuestionId = Number.isFinite(questionId) && questionId > 0 ? questionId : null;
    this.auth.getTestSubmissions(id).subscribe({
      next: (d) => {
        this.data = d;
        this.filteredStudents = this.applyQuestionFilter(d.students);
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) void this.router.navigateByUrl('/login');
        else if (err.status === 403) this.error = 'Доступ только для преподавателя.';
        else if (err.status === 404) this.error = 'Тест не найден.';
        else this.error = 'Не удалось загрузить ответы.';
      },
    });
  }

  /**
   * Фильтрует ответы студентов по выбранному вопросу.
   */
  private applyQuestionFilter(rows: StudentTestSubmissionRowDto[]): StudentTestSubmissionRowDto[] {
    if (this.selectedQuestionId == null) {
      return rows;
    }
    const mapped = rows.map((row) => {
      const answers = row.answers.filter((a) => a.testQuestionId === this.selectedQuestionId);
      if (answers.length > 0 && this.selectedQuestionSortOrder == null) {
        this.selectedQuestionSortOrder = answers[0].sortOrder;
      }
      return { ...row, answers };
    });
    return mapped.filter((row) => row.answers.length > 0);
  }

  /**
   * Возвращает пользователя к аналитике текущего теста.
   */
  goBack(): void {
    if (this.testId != null) {
      void this.router.navigate(['/teacher/tests', this.testId, 'analytics']);
      return;
    }
    void this.router.navigateByUrl('/teacher/analytics');
  }
}
