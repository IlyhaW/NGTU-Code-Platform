import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="student-home">
      <div class="student-home__grid">
        <a routerLink="/student/tests/current" class="student-home__card">
          <span class="student-home__card-icon" aria-hidden="true">📋</span>
          <span class="student-home__card-title">Текущие тесты</span>
          <span class="student-home__card-desc">Активные и доступные для прохождения</span>
        </a>
        <a routerLink="/student/tests/completed" class="student-home__card">
          <span class="student-home__card-icon" aria-hidden="true">✅</span>
          <span class="student-home__card-title">Пройденные тесты</span>
          <span class="student-home__card-desc">История и результаты</span>
        </a>
        <a routerLink="/student/tests/upcoming" class="student-home__card">
          <span class="student-home__card-icon" aria-hidden="true">📅</span>
          <span class="student-home__card-title">Запланированные тесты</span>
          <span class="student-home__card-desc">Запланированные на потом</span>
        </a>
        <a
          href="https://t.me/NGTUCODESUPPORT"
          target="_blank"
          rel="noopener noreferrer"
          class="student-home__card"
        >
          <span class="student-home__card-icon" aria-hidden="true">💬</span>
          <span class="student-home__card-title">Техподдержка</span>
          <span class="student-home__card-desc">Связаться с поддержкой в Telegram</span>
        </a>
      </div>
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

      .student-home {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #d1d5e6;
        padding: clamp(14px, 2.5vh, 24px) clamp(16px, 2.5vw, 28px);
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        box-sizing: border-box;
      }

      .student-home__grid {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: clamp(10px, 1.8vh, 18px);
      }

      .student-home__card {
        flex: 1 1 0;
        min-height: clamp(100px, 16vh, 180px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: clamp(6px, 1.4vh, 14px);
        padding: clamp(12px, 2.5vh, 36px) clamp(16px, 3vw, 32px);
        border-radius: 12px;
        border: 1px solid #ced2e4;
        background: #fafbff;
        text-decoration: none;
        color: inherit;
        transition: box-shadow 0.15s ease, transform 0.08s ease, border-color 0.15s ease, background-color 0.15s ease;
      }

      .student-home__card:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        transform: translateY(-1px);
      }

      .student-home__card-icon {
        font-size: clamp(1.6rem, 5.8vmin, 3.2rem);
        line-height: 1;
      }

      .student-home__card-title {
        font-size: clamp(0.95rem, 2.7vmin, 1.55rem);
        font-weight: 600;
        color: #0f172a;
      }

      .student-home__card-desc {
        font-size: clamp(11px, 1.5vmin, 13px);
        line-height: 1.35;
        color: #6b7280;
        max-width: 36ch;
      }

    `,
  ],
})
/**
 * Компонент главной панели студента.
 */
export class StudentDashboardComponent {}
