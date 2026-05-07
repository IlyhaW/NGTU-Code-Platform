import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AssignmentDto } from '../../api.types';

@Component({
  selector: 'app-topics-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="topics-layout">
      <header class="topics-header">
        <div class="topics-header__left">
          <button type="button" class="topics-header__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="topics-header__title-box">
            <h1 class="topics-header__title">Темы и задачи</h1>
          </div>
        </div>

        <a routerLink="/teacher" class="topics-header__home topics-header__home--right" aria-label="На главную">⌂</a>
      </header>

      <main class="topics-main">
        <div class="topics-search">
          <input
            type="text"
            class="topics-search__input"
            placeholder="Поиск по заданиям и тегам..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilter()"
          />
        </div>

        <div class="topics-board">
          <div class="topics-list" *ngIf="!loading && filteredAssignments.length > 0">
            <div *ngFor="let assignment of filteredAssignments" class="topic-row">
              <a
                [routerLink]="['/teacher/topics', assignment.id]"
                class="topic-row__link"
              >
                <h2 class="topic-card__title">{{ assignment.name }}</h2>
                <div class="topic-card__tags" *ngIf="assignment.tags?.length">
                  <span
                    *ngFor="let tag of assignment.tags"
                    class="topic-card__tag"
                  >{{ tag }}</span>
                </div>
              </a>
              <button
                type="button"
                class="topic-row__remove"
                (click)="removeTopic($event, assignment)"
                [disabled]="deletingTopicId === assignment.id"
                aria-label="Удалить тему"
                title="Удалить тему"
              >
                ×
              </button>
            </div>
          </div>

          <div class="topics-empty" *ngIf="!loading && filteredAssignments.length === 0">
            <p>{{ searchQuery ? 'Ничего не найдено по запросу.' : 'Пока нет тем и заданий.' }}</p>
          </div>

          <div class="topics-loading" *ngIf="loading">
            <p>Загрузка...</p>
          </div>
        </div>

        <div class="topics-actions">
          <button type="button" class="topics-actions__add" (click)="addTopic()">
            Добавить новую тему
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      /* Базовый layout страницы тем и задач. */
      .topics-layout {
        box-sizing: border-box;
        height: 100vh;
        height: 100dvh;
        min-height: 100vh;
        min-height: 100dvh;
        padding: 1.25em 1.5em 1.75em;
        font-size: clamp(16px, 0.65vw + 12px, 24px);
        line-height: 1.45;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .topics-header {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.1em;
        gap: 0.85em;
        flex-wrap: wrap;
      }

      .topics-header__left {
        display: flex;
        align-items: center;
        gap: 0.6em;
      }

      .topics-header__home {
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
      .topics-header__home--right { margin-left: auto; }

      .topics-header__home:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }

      .topics-header__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.55em 0.9em;
        min-width: min(12em, 40vw);
      }

      .topics-header__title {
        margin: 0;
        font-size: 1.2em;
        font-weight: 600;
        color: #111827;
      }

      .topics-header__user-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 2.5em;
      }

      .topics-header__avatar {
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

      .topics-header__avatar-img {
        width: 1.35em;
        height: 1.35em;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5b6b8a;
      }
      .topics-header__avatar-img svg {
        width: 100%;
        height: 100%;
      }

      .topics-header__menu {
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

      .topics-header__menu-name {
        font-size: 0.95em;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 0.1em;
      }

      .topics-header__menu-role {
        font-size: 0.85em;
        color: #475569;
        margin-bottom: 0.35em;
      }

      .topics-header__menu-item {
        padding: 0.45em 0.6em;
        border-radius: 0.45em;
        border: 0;
        background: #e2e8f0;
        color: #1e293b;
        cursor: pointer;
        font-size: 0.95em;
        font-weight: 500;
        text-align: left;
      }

      .topics-header__menu-item:hover {
        background: #cbd5e1;
        color: #0f172a;
      }

      .topics-main {
        width: 100%;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }

      .topics-board {
        flex: 1 1 auto;
        min-height: 0;
        height: 0;
        border: 1px solid #d1d5e6;
        border-radius: 0.65em;
        background: #ffffff;
        padding: 0.85em;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        margin-bottom: 1em;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
      }

      .topics-search {
        flex-shrink: 0;
        margin-bottom: 1em;
      }

      .topics-search__input {
        width: 100%;
        padding: 0.65em 0.85em;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        font-size: 1em;
        background: #fff;
        outline: none;
        box-sizing: border-box;
      }

      .topics-search__input::placeholder {
        color: #9ca3af;
      }

      .topics-search__input:focus {
        border-color: #5b7cff;
        box-shadow: 0 0 0 2px rgba(91, 124, 255, 0.2);
      }

      /* Прокручиваемый список тем. */
      .topics-list {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow-y: auto;
        padding-right: 0.15em;
        border: 1px solid #e2e8f0;
        border-radius: 0.45em;
        background: #ffffff;
        -webkit-overflow-scrolling: touch;
      }

      .topic-card {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.85em 1em;
        margin: 0;
      }
      .topic-row {
        background: #fff;
        padding: 0.1em 0.35em 0.1em 0.45em;
        margin: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.55em;
        border-bottom: 1px solid #e5e7eb;
      }
      .topic-row:last-child { border-bottom: none; }
      .topic-row__link {
        display: block;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        min-width: 0;
        padding: 0.55em 0.25em 0.55em 0.15em;
      }
      .topic-row__link:hover {
        background: #f8fafc;
        border-radius: 0.35em;
      }

      .topic-card__title {
        margin: 0 0 0.25em;
        font-size: 1em;
        font-weight: 600;
        color: #374151;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .topic-card__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45em;
      }

      .topic-card__tag {
        display: inline-block;
        padding: 0.18em 0.42em;
        border-radius: 0.45em;
        background: #c8e6c9;
        color: #1b5e20;
        font-size: 0.82em;
      }
      .topic-row__remove {
        width: 2em;
        min-width: 2em;
        height: 2em;
        align-self: center;
        justify-self: end;
        border: 0;
        border-radius: 0.35em;
        background: transparent;
        color: #b91c1c;
        font-size: 1.25em;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .topic-row__remove:hover:not(:disabled) {
        background: #fee2e2;
      }
      .topic-row__remove:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .topics-empty,
      .topics-loading {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25em;
        text-align: center;
        color: #6b7280;
        font-size: 1em;
      }

      .topics-actions {
        flex-shrink: 0;
      }

      .topics-actions__add {
        padding: 0.65em 1em;
        border-radius: 0.55em;
        border: 0;
        background: #a5c8ff;
        color: #1e3a5f;
        cursor: pointer;
        font-size: 1em;
        font-weight: 500;
        width: 100%;
        box-sizing: border-box;
      }

      .topics-actions__add:hover {
        background: #8bb8ff;
      }

      @media (max-width: 640px) {
        .topics-header {
          flex-direction: column;
          align-items: stretch;
        }

        .topics-header__user-panel {
          width: 100%;
        }
      }
    `,
  ],
})
/**
 * Компонент списка тем и задач преподавателя.
 */
export class TopicsTasksComponent implements OnInit {
  assignments: AssignmentDto[] = [];
  filteredAssignments: AssignmentDto[] = [];
  searchQuery = '';
  loading = true;
  deletingTopicId: number | null = null;
  userMenuOpen = false;
  userDisplayName = 'Преподаватель';
  userRoleLabel = 'Преподаватель';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Инициализирует страницу и загружает профиль преподавателя.
   */
  ngOnInit(): void {
    this.loadAssignments();
    this.auth.getMe().subscribe({
      next: (user) => {
        this.userDisplayName = user.fullName?.trim() || 'Преподаватель';
        this.userRoleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Студент';
      },
      error: () => {},
    });
  }

  /**
   * Загружает список тем с сервера.
   */
  private loadAssignments(): void {
    this.loading = true;
    this.auth.getAssignments().subscribe({
      next: (list) => {
        this.assignments = list;
        this.applyFilter();
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.assignments = [];
        this.filteredAssignments = [];
        if (err?.status === 401) {
          this.router.navigateByUrl('/login');
        }
      },
    });
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
   * Фильтрует список тем по названию и тегам.
   */
  applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredAssignments = [...this.assignments];
      return;
    }
    this.filteredAssignments = this.assignments.filter((a) => {
      const nameMatch = a.name.toLowerCase().includes(q);
      const tagMatch = (a.tags || []).some((t) => t.toLowerCase().includes(q));
      return nameMatch || tagMatch;
    });
  }

  /**
   * Выполняет выход пользователя из системы.
   */
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
  }

  /**
   * Переходит на страницу создания новой темы.
   */
  addTopic(): void {
    void this.router.navigateByUrl('/teacher/topics/new');
  }

  /**
   * Удаляет выбранную тему.
   */
  removeTopic(ev: Event, assignment: AssignmentDto): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!assignment?.id) return;
    const ok = window.confirm(`Удалить тему "${assignment.name}"?`);
    if (!ok) return;
    this.deletingTopicId = assignment.id;
    this.auth.deleteAssignment(assignment.id).subscribe({
      next: () => {
        this.deletingTopicId = null;
        this.assignments = this.assignments.filter((a) => a.id !== assignment.id);
        this.applyFilter();
      },
      error: (err: HttpErrorResponse) => {
        this.deletingTopicId = null;
        if (err?.status === 401) {
          this.router.navigateByUrl('/login');
        }
      },
    });
  }
}
