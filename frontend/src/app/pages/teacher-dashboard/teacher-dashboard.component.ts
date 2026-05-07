import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="teacher-layout">
      <header class="teacher-header">
        <div class="teacher-header__brand">
          <div class="teacher-header__logo">N</div>
          <div class="teacher-header__title">NGTU code - platform</div>
        </div>

        <div class="teacher-header__user-wrapper">
          <button type="button" class="teacher-header__avatar" (click)="toggleUserMenu()" aria-label="Меню">
            <span class="teacher-header__avatar-img" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </span>
          </button>

          <div class="teacher-header__menu" *ngIf="userMenuOpen">
            <div class="teacher-header__menu-name">{{ userDisplayName }}</div>
            <div class="teacher-header__menu-role">{{ userRoleLabel }}</div>
            <button type="button" class="teacher-header__menu-item" (click)="logout()">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main class="teacher-main">
        <aside class="teacher-menu" aria-label="Разделы платформы">
          <div class="teacher-menu__primary">
          <a routerLink="/teacher/topics" class="teacher-menu__item teacher-menu__item-link">
            <div class="teacher-menu__icon">📚</div>
            <div class="teacher-menu__content">
              <div class="teacher-menu__title">Темы и задачи</div>
              <div class="teacher-menu__subtitle">Создавайте и редактируйте задания для студентов</div>
            </div>
          </a>

          <a routerLink="/teacher/groups" class="teacher-menu__item teacher-menu__item-link">
            <div class="teacher-menu__icon">👥</div>
            <div class="teacher-menu__content">
              <div class="teacher-menu__title">Группы</div>
              <div class="teacher-menu__subtitle">Участники, создание и удаление групп</div>
            </div>
          </a>

          <a routerLink="/teacher/tests/new" class="teacher-menu__item teacher-menu__item-link">
            <div class="teacher-menu__icon">✏️</div>
            <div class="teacher-menu__content">
              <div class="teacher-menu__title">Создать новый тест</div>
              <div class="teacher-menu__subtitle">Быстрая настройка параметров и вопросов теста</div>
            </div>
          </a>

          <a routerLink="/teacher/tests/saved" class="teacher-menu__item teacher-menu__item-link">
            <div class="teacher-menu__icon">💾</div>
            <div class="teacher-menu__content">
              <div class="teacher-menu__title">Сохранённые тесты</div>
              <div class="teacher-menu__subtitle">Просмотр, запуск и изменение готовых тестов</div>
            </div>
          </a>

          <a routerLink="/teacher/analytics" class="teacher-menu__item teacher-menu__item-link">
            <div class="teacher-menu__icon">📊</div>
            <div class="teacher-menu__content">
              <div class="teacher-menu__title">Аналитика</div>
              <div class="teacher-menu__subtitle">Ответы студентов по сохранённым тестам</div>
            </div>
          </a>
          </div>

          <a
            href="https://t.me/NGTUCODESUPPORT"
            target="_blank"
            rel="noopener noreferrer"
            class="teacher-menu__item teacher-menu__item-link teacher-menu__item--footer"
          >
            <div class="teacher-menu__icon">💬</div>
            <div class="teacher-menu__content">
              <div class="teacher-menu__title">Техподдержка</div>
              <div class="teacher-menu__subtitle">Связаться с поддержкой в Telegram</div>
            </div>
          </a>
        </aside>
      </main>
    </div>
  `,
  styles: [
    `
      .teacher-layout {
        position: fixed;
        inset: 0;
        z-index: 0;
        height: 100dvh;
        max-height: 100dvh;
        min-height: 0;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
        padding: max(10px, env(safe-area-inset-top, 0px)) 14px max(12px, env(safe-area-inset-bottom, 0px));
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .teacher-header {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        gap: 10px;
      }

      .teacher-header__brand {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        border: 1px solid #b0b4c4;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
      }

      .teacher-header__logo {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: linear-gradient(135deg, #5b7cff, #2f5bea);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.03em;
      }

      .teacher-header__title {
        font-size: clamp(16px, 2.2vmin, 22px);
        font-weight: 600;
        color: #141626;
        white-space: nowrap;
      }

      .teacher-header__user-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 75px;
      }

      .teacher-header__avatar {
        width: clamp(48px, 9vmin, 64px);
        height: clamp(48px, 9vmin, 64px);
        border-radius: 999px;
        border: 1px solid #cbd0e2;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
      }

      .teacher-header__avatar-img {
        width: clamp(26px, 5vmin, 34px);
        height: clamp(26px, 5vmin, 34px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5b6b8a;
      }
      .teacher-header__avatar-img svg {
        width: 100%;
        height: 100%;
      }

      .teacher-header__menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #94a3b8;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.2);
        padding: 12px 14px;
        min-width: 260px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .teacher-header__menu-name {
        font-size: 15px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 2px;
      }

      .teacher-header__menu-role {
        font-size: 13px;
        color: #475569;
        margin-bottom: 6px;
      }

      .teacher-header__menu-item {
        padding: 10px 12px;
        border-radius: 8px;
        border: 0;
        background: #e2e8f0;
        color: #1e293b;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        text-align: left;
      }

      .teacher-header__menu-item:hover {
        background: #cbd5e1;
        color: #0f172a;
      }

      .teacher-main {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      .teacher-menu {
        flex: 1;
        min-height: 0;
        width: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: repeat(6, minmax(0, 1fr));
        gap: clamp(6px, 0.9vh, 10px);
      }

      .teacher-menu__primary {
        display: contents;
      }

      .teacher-menu__item,
      .teacher-menu__item-link {
        width: 100%;
        min-width: 0;
        min-height: 0;
        display: flex;
        align-items: center;
        gap: clamp(10px, 2vw, 18px);
        text-align: left;
        padding: clamp(6px, 1vh, 12px) clamp(12px, 2.2vw, 22px);
        border-radius: 12px;
        border: 1px solid #ced2e4;
        background: #ffffff;
        cursor: pointer;
        font-size: clamp(13px, 1.5vmin, 16px);
        transition: box-shadow 0.15s ease, transform 0.08s ease, border-color 0.15s ease, background-color 0.15s ease;
        text-decoration: none;
        color: inherit;
        box-sizing: border-box;
        overflow: hidden;
      }

      .teacher-menu__item-link:hover,
      .teacher-menu__item:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        transform: translateY(-1px);
      }

      .teacher-menu__icon {
        flex-shrink: 0;
        width: clamp(36px, 5.5vmin, 52px);
        height: clamp(36px, 5.5vmin, 52px);
        border-radius: 10px;
        background: #edf0ff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(1.1rem, 3.2vmin, 1.65rem);
        line-height: 1;
      }

      .teacher-menu__content {
        display: flex;
        flex-direction: column;
        gap: clamp(2px, 0.4vh, 6px);
        min-width: 0;
        flex: 1 1 auto;
        justify-content: center;
        overflow: hidden;
      }

      .teacher-menu__title {
        font-weight: 600;
        font-size: clamp(0.95rem, 2vmin, 1.28rem);
        line-height: 1.2;
        color: #111827;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .teacher-menu__subtitle {
        font-size: clamp(0.72rem, 1.35vmin, 0.88rem);
        line-height: 1.3;
        color: #6b7280;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .teacher-header {
          flex-direction: column;
          align-items: stretch;
        }

        .teacher-menu__item,
        .teacher-menu__item-link {
          flex-direction: column;
          text-align: center;
          justify-content: center;
        }

        .teacher-menu__content {
          align-items: center;
        }
      }
    `,
  ],
})
/**
 * Компонент главной панели преподавателя.
 */
export class TeacherDashboardComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  userMenuOpen = false;
  userDisplayName = 'Преподаватель';
  userRoleLabel = 'Преподаватель';

  /**
   * Инициализирует данные текущего пользователя.
   */
  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => {
        this.userDisplayName = user.fullName?.trim() || 'Преподаватель';
        this.userRoleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Студент';
      },
      error: () => {},
    });
  }

  /**
   * Переключает отображение пользовательского меню.
   */
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  /**
   * Выполняет выход пользователя из системы.
   */
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
  }
}

