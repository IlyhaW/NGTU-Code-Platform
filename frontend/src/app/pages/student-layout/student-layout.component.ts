import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="student-shell">
      <header class="student-shell__header" *ngIf="showShellHeader">
        <a routerLink="/student" class="student-shell__brand">
          <div class="student-shell__logo">N</div>
          <div class="student-shell__title">NGTU code - platform</div>
        </a>

        <div class="student-shell__user-wrapper">
          <button type="button" class="student-shell__avatar" (click)="toggleUserMenu()" aria-label="Меню">
            <span class="student-shell__avatar-img" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </span>
          </button>

          <div class="student-shell__menu" *ngIf="userMenuOpen">
            <div class="student-shell__menu-name">{{ userDisplayName }}</div>
            <div class="student-shell__menu-role">{{ userRoleLabel }}</div>
            <button type="button" class="student-shell__menu-item" (click)="logout()">Выйти</button>
          </div>
        </div>
      </header>

      <div class="student-shell__body" [class.student-shell__body--full]="!showAside">
        <main class="student-shell__main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .student-shell {
        min-height: 100vh;
        min-height: 100dvh;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
        padding: 12px 16px 16px;
        font-size: clamp(16px, 0.65vw + 12px, 24px);
        line-height: 1.45;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .student-shell__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        gap: 12px;
        padding: 0 clamp(16px, 2.5vw, 28px);
      }

      .student-shell__brand {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        border: 1px solid #b0b4c4;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        text-decoration: none;
        color: inherit;
      }

      .student-shell__logo {
        width: 30px;
        height: 30px;
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

      .student-shell__title {
        font-size: 1em;
        font-weight: 600;
        color: #141626;
        white-space: nowrap;
      }

      .student-shell__user-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 2.75em;
      }

      .student-shell__avatar {
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

      .student-shell__avatar-img {
        width: clamp(26px, 5vmin, 34px);
        height: clamp(26px, 5vmin, 34px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5b6b8a;
      }
      .student-shell__avatar-img svg {
        width: 100%;
        height: 100%;
      }

      .student-shell__menu {
        position: absolute;
        top: calc(100% + 0.35em);
        right: 0;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #94a3b8;
        box-shadow: 0 0.45em 1em rgba(15, 23, 42, 0.2);
        padding: 12px 14px;
        min-width: 260px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .student-shell__menu-name {
        font-size: 15px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 2px;
      }

      .student-shell__menu-role {
        font-size: 13px;
        color: #475569;
        margin-bottom: 6px;
      }

      .student-shell__menu-item {
        padding: 10px 12px;
        border-radius: 8px;
        border: 0;
        background: #e2e8f0;
        color: #1e293b;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        text-align: left;
        font-family: inherit;
      }

      .student-shell__menu-item:hover {
        background: #cbd5e1;
        color: #0f172a;
      }

      .student-shell__body {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        align-items: stretch;
        gap: 14px;
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
      }

      .student-shell__body--full {
        grid-template-columns: minmax(0, 1fr);
      }

      .student-shell__main {
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .student-shell__body {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
/**
 * Компонент каркаса раздела студента.
 */
export class StudentLayoutComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  userMenuOpen = false;
  userDisplayName = 'Студент';
  userRoleLabel = 'Студент';

  /**
   * Показывает хедер только на главной странице студента.
   */
  get showShellHeader(): boolean {
    return /^\/student\/?$/.test(this.router.url.split('?')[0] ?? '/student');
  }

  /**
   * Возвращает признак показа боковой панели.
   */
  get showAside(): boolean {
    return false;
  }

  /**
   * Загружает профиль текущего пользователя.
   */
  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => {
        this.userDisplayName = user.fullName?.trim() || 'Студент';
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
