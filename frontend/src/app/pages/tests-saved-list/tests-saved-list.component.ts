import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { TestListItemDto } from '../../api.types';

@Component({
  selector: 'app-tests-saved-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="saved-layout">
      <header class="saved-header">
        <div class="saved-header__brand">
          <button type="button" class="saved-header__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="saved-header__title-box">
            <h1 class="saved-header__title">{{ pageTitle }}</h1>
          </div>
        </div>

        <a routerLink="/teacher" class="saved-header__home saved-header__home--right" aria-label="На главную">⌂</a>
      </header>

      <div class="saved-msg saved-msg--error" *ngIf="pageError">{{ pageError }}</div>

      <main class="saved-main">
        <div class="saved-loading" *ngIf="loading">Загрузка…</div>

        <div class="saved-empty" *ngIf="!loading && items.length === 0">
          <p *ngIf="listMode === 'saved'">Пока нет сохранённых тестов.</p>
          <p *ngIf="listMode === 'analytics'">Пока нет тестов.</p>
          <a *ngIf="listMode === 'saved'" routerLink="/teacher/tests/new" class="saved-link">Создать первый тест</a>
        </div>

        <ul class="saved-list" *ngIf="!loading && items.length > 0">
          <li *ngFor="let t of items" class="saved-list__item">
            <a [routerLink]="testCardLink(t.id)" class="saved-card">
              <div class="saved-card__main">
                <span class="saved-card__name">{{ t.name }}</span>
                <span class="saved-card__status" [class.saved-card__status--active]="t.status === 'active'">{{
                  statusLabel(t.status)
                }}</span>
              </div>
              <div class="saved-card__meta">
                <span>Создан: {{ formatDt(t.createdAt) }}</span>
              </div>
            </a>
          </li>
        </ul>
      </main>

      <footer class="saved-footer" *ngIf="listMode === 'saved'">
        <a routerLink="/teacher/tests/new" class="saved-btn saved-btn--primary saved-btn--full">Создать новый тест</a>
      </footer>
    </div>
  `,
  styles: [
    `
      .saved-layout {
        box-sizing: border-box;
        min-height: 100vh;
        min-height: 100dvh;
        padding: 16px 20px 24px;
        font-size: clamp(16px, 0.65vw + 12px, 24px);
        line-height: 1.45;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
        display: flex;
        flex-direction: column;
      }

      .saved-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.85em;
        margin-bottom: 1.25em;
        flex-wrap: wrap;
      }

      .saved-header__brand {
        display: flex;
        align-items: center;
        gap: 0.6em;
        min-width: 0;
        flex: 1 1 auto;
      }

      .saved-header__home {
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
        padding: 0;
        cursor: pointer;
        font-family: inherit;
      }
      .saved-header__home--right { margin-left: auto; }

      .saved-header__home:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }

      .saved-header__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.55em 0.9em;
        min-width: min(12em, 40vw);
        max-width: min(36em, 92vw);
      }

      .saved-header__title {
        margin: 0;
        font-size: 1.2em;
        font-weight: 600;
        color: #111827;
      }

      .saved-header__user-wrapper {
        position: relative;
        flex-shrink: 0;
      }

      .saved-header__avatar {
        width: 2.5em;
        height: 2.5em;
        border-radius: 999px;
        border: 1px solid #cbd0e2;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
      }

      .saved-header__avatar-img {
        width: 1.35em;
        height: 1.35em;
        color: #5b6b8a;
      }
      .saved-header__avatar-img svg {
        width: 100%;
        height: 100%;
      }

      .saved-header__menu {
        position: absolute;
        top: calc(100% + 0.35em);
        right: 0;
        background: #ffffff;
        border-radius: 0.55em;
        border: 1px solid #94a3b8;
        box-shadow: 0 0.45em 1em rgba(15, 23, 42, 0.2);
        padding: 0.55em 0.65em;
        min-width: 10em;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 0.35em;
      }

      .saved-header__menu-name {
        font-weight: 600;
        font-size: 0.9em;
        color: #1e293b;
      }

      .saved-header__menu-role {
        font-size: 0.78em;
        color: #64748b;
      }

      .saved-header__menu-item {
        border: 0;
        background: transparent;
        text-align: left;
        padding: 0.35em 0;
        font-size: 0.88em;
        color: #b91c1c;
        cursor: pointer;
        font-family: inherit;
      }

      .saved-msg {
        padding: 0.65em 0.9em;
        border-radius: 0.5em;
        margin-bottom: 1em;
        font-size: 0.9em;
      }

      .saved-msg--error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .saved-main {
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
      }

      .saved-footer {
        flex-shrink: 0;
        margin-top: 1.25em;
        padding-top: 0.25em;
      }

      .saved-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.55em 1.1em;
        border-radius: 0.55em;
        font-size: 0.95em;
        font-weight: 600;
        text-decoration: none;
        font-family: inherit;
        border: 1px solid transparent;
        cursor: pointer;
        box-sizing: border-box;
      }

      .saved-btn--full {
        width: 100%;
        padding: 0.65em 1em;
      }

      .saved-btn--primary {
        background: #a5c8ff;
        color: #1e3a5f;
        border-color: #7eb3ff;
      }

      .saved-btn--primary:hover {
        background: #8bb8ff;
      }

      .saved-loading,
      .saved-empty {
        padding: 1.5em 1em;
        text-align: center;
        color: #64748b;
        background: rgba(255, 255, 255, 0.75);
        border-radius: 0.65em;
        border: 1px solid #d1d5e6;
      }

      .saved-link {
        color: #2563eb;
        font-weight: 600;
      }

      .saved-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75em;
      }

      .saved-list__item {
        margin: 0;
      }

      .saved-card {
        display: block;
        text-decoration: none;
        color: inherit;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #c5cce0;
        border-radius: 0.65em;
        padding: 1em 1.15em;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .saved-card:hover {
        border-color: #8bb8ff;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);
      }

      .saved-card__main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75em;
        margin-bottom: 0.5em;
        flex-wrap: wrap;
      }

      .saved-card__name {
        font-weight: 700;
        font-size: 1.05em;
        color: #0f172a;
        word-break: break-word;
      }

      .saved-card__status {
        font-size: 0.78em;
        font-weight: 600;
        padding: 0.25em 0.55em;
        border-radius: 999px;
        background: #e2e8f0;
        color: #475569;
        flex-shrink: 0;
      }

      .saved-card__status--active {
        background: #d1fae5;
        color: #065f46;
      }

      .saved-card__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75em 1.25em;
        font-size: 0.82em;
        color: #64748b;
      }
    `,
  ],
})
/**
 * Компонент списка сохраненных тестов и аналитики.
 */
export class TestsSavedListComponent implements OnInit {
  items: TestListItemDto[] = [];
  loading = true;
  pageError = '';

  /**
   * Режим отображения списка тестов.
   */
  listMode: 'saved' | 'analytics' = 'saved';

  userMenuOpen = false;
  userDisplayName = 'Преподаватель';
  userRoleLabel = 'Преподаватель';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    const m = this.route.snapshot.data['testsListMode'];
    this.listMode = m === 'analytics' ? 'analytics' : 'saved';
  }

  /**
   * Возвращает заголовок страницы для текущего режима.
   */
  get pageTitle(): string {
    return this.listMode === 'analytics' ? 'Аналитика' : 'Сохранённые тесты';
  }

  /**
   * Возвращает ссылку карточки теста в зависимости от режима.
   */
  testCardLink(testId: number): (string | number)[] {
    return this.listMode === 'analytics'
      ? ['/teacher', 'tests', testId, 'analytics']
      : ['/teacher', 'tests', testId, 'edit'];
  }

  /**
   * Инициализирует режим и загружает список тестов.
   */
  ngOnInit(): void {
    this.route.data.subscribe((d) => {
      const m = d['testsListMode'];
      this.listMode = m === 'analytics' ? 'analytics' : 'saved';
    });
    this.auth.getMe().subscribe({
      next: (user) => {
        this.userDisplayName = user.fullName?.trim() || 'Преподаватель';
        this.userRoleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Студент';
        if (user.role !== 'teacher') {
          void this.router.navigateByUrl('/login');
          return;
        }
        this.loadList();
      },
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  /**
   * Загружает список тестов преподавателя.
   */
  private loadList(): void {
    this.loading = true;
    this.pageError = '';
    this.auth.listMyTests().subscribe({
      next: (list) => {
        this.items = list;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.items = [];
        if (err.status === 401) void this.router.navigateByUrl('/login');
        else this.pageError = 'Не удалось загрузить список тестов.';
      },
    });
  }

  /**
   * Форматирует дату и время в локальный вид.
   */
  formatDt(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  }

  /**
   * Преобразует статус теста в русскую подпись.
   */
  statusLabel(s: string): string {
    const m: Record<string, string> = { draft: 'Черновик', active: 'Активен', archived: 'В архиве' };
    return m[s] ?? s;
  }

  /**
   * Переключает отображение пользовательского меню.
   */
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  /**
   * Возвращает пользователя на главную страницу преподавателя.
   */
  goBack(): void {
    void this.router.navigateByUrl('/teacher');
  }

  /**
   * Выполняет выход пользователя из системы.
   */
  logout(): void {
    localStorage.removeItem('token');
    void this.router.navigateByUrl('/login');
  }
}
