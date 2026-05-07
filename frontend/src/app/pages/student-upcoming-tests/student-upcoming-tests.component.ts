import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { StudentTestListItemDto } from '../../api.types';

@Component({
  selector: 'app-student-upcoming-tests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="student-tests">
      <header class="student-tests__header">
        <a routerLink="/student" class="student-tests__home" aria-label="Назад">←</a>
        <div class="student-tests__title-box">
          <h1 class="student-tests__title">Запланированные тесты</h1>
        </div>
        <a routerLink="/student" class="student-tests__home student-tests__home--right" aria-label="На главную">⌂</a>
      </header>
      <section class="student-tests__board">
        <div *ngIf="loading" class="student-tests__msg">Загрузка...</div>
        <div *ngIf="error" class="student-tests__msg student-tests__msg--error">{{ error }}</div>

        <div *ngIf="!loading && !error && tests.length === 0" class="student-tests__empty">
          Нет запланированных тестов с будущей датой начала.
        </div>

        <ul *ngIf="!loading && tests.length > 0" class="student-tests__list">
          <li *ngFor="let t of tests" class="student-tests__item">
            <div class="student-tests__card" tabindex="0" role="group" [attr.aria-label]="t.name">
              <h2 class="student-tests__name">{{ t.name }}</h2>
              <div class="student-tests__dates">
                <span class="student-tests__date"
                  ><strong>Начало:</strong> {{ t.startDate | date : 'dd.MM.yyyy, HH:mm' }}</span
                >
                <span class="student-tests__date"
                  ><strong>Окончание:</strong> {{ t.endDate | date : 'dd.MM.yyyy, HH:mm' }}</span
                >
              </div>
              <div class="student-tests__tags" *ngIf="t.tags?.length">
                <span class="student-tests__tags-label">Теги:</span>
                <span *ngFor="let tag of t.tags" class="student-tests__tag">{{ tag }}</span>
              </div>
              <p class="student-tests__locked">Задания откроются после наступления даты начала.</p>
            </div>
          </li>
        </ul>
      </section>
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

      .student-tests {
        flex: 1 1 auto;
        min-height: 0;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #d1d5e6;
        padding: 20px 22px 24px;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .student-tests__board {
        flex: 1 1 auto;
        min-height: 0;
        height: 0;
        border: 1px solid #d1d5e6;
        border-radius: 0.65em;
        background: #ffffff;
        padding: 12px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .student-tests__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.85em;
        margin-bottom: 1em;
      }

      .student-tests__home {
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
        font-size: 1.15em;
        flex-shrink: 0;
      }

      .student-tests__home:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }

      .student-tests__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.55em 0.9em;
        width: fit-content;
        min-width: 0;
        max-width: 92vw;
      }

      .student-tests__title {
        margin: 0;
        font-size: 1.2em;
        font-weight: 600;
        color: #111827;
        overflow-wrap: anywhere;
      }

      .student-tests__msg {
        font-size: 14px;
        color: #64748b;
      }

      .student-tests__msg--error {
        color: #b91c1c;
      }

      .student-tests__empty {
        padding: 1.25em;
        border-radius: 10px;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        color: #64748b;
        font-size: 14px;
        line-height: 1.45;
      }

      .student-tests__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 14px;
        overflow: auto;
        min-height: 0;
      }

      .student-tests__item {
        flex: 0 0 auto;
        padding: 0;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fafbff;
        overflow: hidden;
        min-height: 7.2em;
      }

      .student-tests__card {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0.45em;
        min-height: 100%;
        padding: 1em 1.1em;
        outline: none;
      }

      .student-tests__card:focus-visible {
        box-shadow: inset 0 0 0 2px #94a3b8;
      }

      .student-tests__name {
        margin: 0 0 10px;
        font-size: 1.05rem;
        font-weight: 600;
        color: #0f172a;
      }

      .student-tests__dates {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 20px;
        margin-bottom: 10px;
        font-size: 13px;
        color: #334155;
      }

      .student-tests__date strong {
        font-weight: 600;
        color: #0f172a;
      }

      .student-tests__tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .student-tests__tags-label {
        font-size: 13px;
        font-weight: 600;
        color: #475569;
      }

      .student-tests__tag {
        display: inline-block;
        padding: 0.25em 0.55em;
        border-radius: 0.45em;
        background: #e0e7ff;
        color: #3730a3;
        font-size: 12px;
        font-weight: 500;
      }

      .student-tests__locked {
        margin: 0;
        font-size: 13px;
        line-height: 1.45;
        color: #64748b;
      }
    `,
  ],
})
/**
 * Компонент списка запланированных тестов студента.
 */
export class StudentUpcomingTestsComponent implements OnInit {
  tests: StudentTestListItemDto[] = [];
  loading = true;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  /**
   * Загружает запланированные тесты студента.
   */
  ngOnInit(): void {
    this.auth.getStudentUpcomingTests().subscribe({
      next: (list) => {
        this.tests = list ?? [];
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) void this.router.navigateByUrl('/login');
        else if (err.status === 403) this.error = 'Доступ только для студентов.';
        else this.error = 'Не удалось загрузить список.';
      },
    });
  }
}
