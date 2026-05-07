import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GroupMemberDto, GroupSummaryDto } from '../../api.types';

@Component({
  selector: 'app-teacher-groups',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="groups-layout">
      <header class="groups-header">
        <div class="groups-header__left">
          <button type="button" class="groups-header__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="groups-header__title-box">
            <h1 class="groups-header__title">Группы</h1>
          </div>
        </div>
        <a routerLink="/teacher" class="groups-header__home groups-header__home--right" aria-label="На главную">⌂</a>
      </header>

      <div class="groups-msg groups-msg--error" *ngIf="pageError">{{ pageError }}</div>

      <main class="groups-main" *ngIf="!pageLoading">
        <div class="groups-toolbar">
          <label class="groups-toolbar__field">
            <span class="groups-toolbar__label">Новая группа</span>
            <input
              type="text"
              class="groups-toolbar__input"
              [(ngModel)]="newGroupName"
              placeholder="Название"
              (keyup.enter)="createGroup()"
            />
          </label>
          <button
            type="button"
            class="groups-actions__add"
            (click)="createGroup()"
            [disabled]="busy"
          >
            Добавить новую группу
          </button>
        </div>

        <div class="groups-columns">
          <div class="groups-board">
            <h2 class="groups-board__heading">Список групп</h2>
            <div class="groups-loading" *ngIf="groupsLoading">Загрузка…</div>
            <div class="groups-list" *ngIf="!groupsLoading && groups.length > 0">
              <div *ngFor="let g of groups" class="groups-row">
                <button
                  type="button"
                  class="groups-row__link"
                  [class.groups-row__link--active]="selectedGroupId === g.id"
                  (click)="selectGroup(g)"
                >
                  <span class="groups-row__title">{{ g.name }}</span>
                  <span class="groups-row__badge">{{ g.memberCount }}</span>
                </button>
                <button
                  type="button"
                  class="groups-row__remove"
                  (click)="deleteGroup($event, g)"
                  [disabled]="busy"
                  aria-label="Удалить группу"
                  title="Удалить группу"
                >×</button>
              </div>
            </div>
            <div class="groups-empty" *ngIf="!groupsLoading && groups.length === 0">
              <p>Групп пока нет.</p>
            </div>
          </div>

          <div class="groups-board">
            <h2 class="groups-board__heading">Участники</h2>
            <p class="groups-hint" *ngIf="selectedGroupId === null">Выберите группу слева.</p>
            <div class="groups-loading" *ngIf="selectedGroupId !== null && membersLoading">Загрузка…</div>
            <div class="groups-list" *ngIf="selectedGroupId !== null && !membersLoading && members.length > 0">
              <div *ngFor="let m of members" class="groups-row">
                <div class="groups-row__link groups-row__link--static">
                  <span class="groups-row__title">{{ m.fullName }}</span>
                  <span class="groups-row__meta">{{ m.login }} · {{ roleLabel(m.role) }}</span>
                </div>
                <button
                  type="button"
                  class="groups-row__remove"
                  (click)="removeMember($event, m)"
                  [disabled]="busy"
                  aria-label="Убрать из группы"
                  title="Убрать из группы"
                >×</button>
              </div>
            </div>
            <div
              class="groups-empty"
              *ngIf="selectedGroupId !== null && !membersLoading && members.length === 0"
            >
              <p>В группе пока нет пользователей.</p>
            </div>
          </div>
        </div>
      </main>

      <div class="groups-loading groups-loading--page" *ngIf="pageLoading">Загрузка…</div>
    </div>
  `,
  styles: [
    `
      /* Базовый layout страницы групп. */
      .groups-layout {
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

      .groups-header {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.1em;
        gap: 0.85em;
        flex-wrap: wrap;
      }

      .groups-header__left {
        display: flex;
        align-items: center;
        gap: 0.6em;
        min-width: 0;
      }

      .groups-header__home {
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
      .groups-header__home--right {
        margin-left: auto;
      }

      .groups-header__home:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }

      .groups-header__title-box {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.55em 0.9em;
        min-width: min(12em, 40vw);
        max-width: min(36em, 92vw);
      }

      .groups-header__title {
        margin: 0;
        font-size: 1.2em;
        font-weight: 600;
        color: #111827;
      }

      .groups-msg {
        flex-shrink: 0;
        padding: 0.55em 0.85em;
        border-radius: 0.5em;
        margin-bottom: 0.75em;
        font-size: 0.88em;
      }

      .groups-msg--error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .groups-main {
        width: 100%;
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .groups-toolbar {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75em;
        margin-bottom: 1em;
      }

      /* Поле формы переопределяет глобальный стиль label. */
      .groups-toolbar__field {
        display: flex;
        flex-direction: column;
        gap: 0.45em;
        font-size: inherit;
        margin-bottom: 0;
      }

      .groups-toolbar__label {
        font-size: 0.95em;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.45;
      }

      .groups-toolbar__input {
        width: 100%;
        padding: 0.85em 1em;
        min-height: 3.25em;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        font-size: 1.08em;
        background: #fff;
        outline: none;
        box-sizing: border-box;
        font-family: inherit;
      }

      .groups-toolbar__input:focus {
        border-color: #5b7cff;
        box-shadow: 0 0 0 2px rgba(91, 124, 255, 0.2);
      }

      .groups-actions__add {
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
        font-family: inherit;
      }

      .groups-actions__add:hover:not(:disabled) {
        background: #8bb8ff;
      }

      .groups-actions__add:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .groups-columns {
        flex: 1 1 0;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
        grid-template-rows: minmax(0, 1fr);
        gap: 1.1em;
        align-items: stretch;
        overflow: hidden;
      }

      @media (max-width: 720px) {
        .groups-columns {
          grid-template-columns: 1fr;
          overflow-y: auto;
        }
      }

      /* Панель списка групп и участников. */
      .groups-board {
        min-height: 0;
        align-self: stretch;
        border: 1px solid #d1d5e6;
        border-radius: 0.65em;
        background: #ffffff;
        padding: 0.85em;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        overflow: hidden;
      }

      .groups-board__heading {
        flex-shrink: 0;
        margin: 0 0 0.65em;
        font-size: 0.95em;
        font-weight: 700;
        color: #1e293b;
      }

      .groups-hint {
        flex-shrink: 0;
        margin: 0 0 0.65em;
        font-size: 0.88em;
        color: #64748b;
      }

      .groups-loading {
        flex-shrink: 0;
        font-size: 0.88em;
        color: #64748b;
        padding: 0.25em 0;
      }

      /* Прокручиваемый список элементов. */
      .groups-list {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding-right: 0.15em;
        border: 1px solid #e2e8f0;
        border-radius: 0.45em;
        background: #ffffff;
        -webkit-overflow-scrolling: touch;
      }

      .groups-empty {
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

      .groups-empty p {
        margin: 0;
      }

      /* Строка элемента списка. */
      .groups-row {
        background: #fff;
        padding: 0.1em 0.35em 0.1em 0.45em;
        margin: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.55em;
        border-bottom: 1px solid #e5e7eb;
      }

      .groups-row:last-child {
        border-bottom: none;
      }

      .groups-row__link {
        display: block;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        min-width: 0;
        padding: 0.55em 0.25em 0.55em 0.15em;
        border: 0;
        background: none;
        font: inherit;
        text-align: left;
        width: 100%;
        box-sizing: border-box;
      }

      .groups-row__link:hover {
        background: #f8fafc;
        border-radius: 0.35em;
      }

      .groups-row__link--active {
        background: #eef2ff;
        border-radius: 0.35em;
        box-shadow: 0 0 0 1px rgba(91, 124, 255, 0.2);
      }

      .groups-row__link--static {
        cursor: default;
      }

      .groups-row__link--static:hover {
        background: transparent;
      }

      .groups-row__title {
        display: block;
        margin: 0 0 0.15em;
        font-size: 1em;
        font-weight: 600;
        color: #374151;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .groups-row__badge {
        display: inline-block;
        font-weight: 700;
        font-size: 0.85em;
        padding: 0.15em 0.5em;
        border-radius: 999px;
        background: #e2e8f0;
        color: #475569;
      }

      .groups-row__meta {
        display: block;
        font-size: 0.82em;
        color: #64748b;
        font-weight: 400;
      }

      .groups-row__remove {
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
        font-family: inherit;
        padding: 0;
      }

      .groups-row__remove:hover:not(:disabled) {
        background: #fee2e2;
      }

      .groups-row__remove:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .groups-loading--page {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2em;
        text-align: center;
        color: #64748b;
      }
    `,
  ],
})
/**
 * Компонент управления учебными группами преподавателя.
 */
export class TeacherGroupsComponent implements OnInit {
  groups: GroupSummaryDto[] = [];
  members: GroupMemberDto[] = [];
  selectedGroupId: number | null = null;
  newGroupName = '';

  pageLoading = true;
  groupsLoading = false;
  membersLoading = false;
  busy = false;
  pageError = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  /**
   * Инициализирует страницу и проверяет роль пользователя.
   */
  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => {
        if (user.role !== 'teacher') {
          void this.router.navigateByUrl('/login');
          return;
        }
        this.loadGroups();
      },
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  /**
   * Загружает список групп преподавателя.
   */
  loadGroups(): void {
    this.groupsLoading = true;
    this.pageError = '';
    this.auth.listTeacherGroups().subscribe({
      next: (list) => {
        this.groups = list;
        this.groupsLoading = false;
        this.pageLoading = false;
        if (this.selectedGroupId != null && !list.some((g) => g.id === this.selectedGroupId)) {
          this.selectedGroupId = null;
          this.members = [];
        }
      },
      error: (err: HttpErrorResponse) => {
        this.groupsLoading = false;
        this.pageLoading = false;
        this.groups = [];
        if (err.status === 401) void this.router.navigateByUrl('/login');
        else this.pageError = 'Не удалось загрузить группы.';
      },
    });
  }

  /**
   * Выбирает группу и загружает ее участников.
   */
  selectGroup(g: GroupSummaryDto): void {
    this.pageError = '';
    this.selectedGroupId = g.id;
    this.membersLoading = true;
    this.members = [];
    this.auth.listGroupMembers(g.id).subscribe({
      next: (list) => {
        this.members = list;
        this.membersLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.membersLoading = false;
        this.members = [];
        if (err.status === 401) void this.router.navigateByUrl('/login');
        else this.pageError = 'Не удалось загрузить участников.';
      },
    });
  }

  /**
   * Создает новую группу по введенному названию.
   */
  createGroup(): void {
    const name = this.newGroupName.trim();
    if (!name) {
      this.pageError = 'Введите название группы.';
      return;
    }
    this.pageError = '';
    this.busy = true;
    this.auth.createTeacherGroup(name).subscribe({
      next: (created) => {
        this.busy = false;
        this.newGroupName = '';
        this.loadGroups();
        this.selectGroup(created);
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        const msg = err?.error?.message ?? err?.message ?? 'Не удалось создать группу';
        this.pageError = typeof msg === 'string' ? msg : 'Не удалось создать группу';
        if (err.status === 401) void this.router.navigateByUrl('/login');
      },
    });
  }

  /**
   * Удаляет выбранную группу.
   */
  deleteGroup(ev: Event, g: GroupSummaryDto): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (
      !confirm(
        `Удалить группу «${g.name}»? Это возможно только если в ней нет участников и она не используется в тестах.`,
      )
    ) {
      return;
    }
    this.pageError = '';
    this.busy = true;
    this.auth.deleteTeacherGroup(g.id).subscribe({
      next: () => {
        this.busy = false;
        if (this.selectedGroupId === g.id) {
          this.selectedGroupId = null;
          this.members = [];
        }
        this.loadGroups();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        const msg = err?.error?.message ?? err?.message ?? 'Не удалось удалить группу';
        this.pageError = typeof msg === 'string' ? msg : 'Не удалось удалить группу';
        if (err.status === 401) void this.router.navigateByUrl('/login');
      },
    });
  }

  /**
   * Удаляет участника из выбранной группы.
   */
  removeMember(ev: Event, m: GroupMemberDto): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.selectedGroupId == null) return;
    if (!confirm(`Убрать «${m.fullName}» из группы?`)) return;
    this.pageError = '';
    this.busy = true;
    this.auth.removeGroupMember(this.selectedGroupId, m.id).subscribe({
      next: () => {
        this.busy = false;
        this.members = this.members.filter((x) => x.id !== m.id);
        this.loadGroups();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        const msg = err?.error?.message ?? err?.message ?? 'Не удалось убрать участника';
        this.pageError = typeof msg === 'string' ? msg : 'Не удалось убрать участника';
        if (err.status === 401) void this.router.navigateByUrl('/login');
      },
    });
  }

  /**
   * Преобразует техническую роль в читаемую подпись.
   */
  roleLabel(role: string): string {
    const map: Record<string, string> = { student: 'студент', teacher: 'преподаватель' };
    return map[role] ?? role;
  }

  /**
   * Возвращает пользователя на главную страницу преподавателя.
   */
  goBack(): void {
    void this.router.navigateByUrl('/teacher');
  }
}
