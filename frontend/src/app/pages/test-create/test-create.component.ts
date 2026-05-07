import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TestCreateDraftService } from '../../services/test-create-draft.service';
import { GroupDto } from '../../api.types';

@Component({
  selector: 'app-test-create',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="test-layout">
      <header class="test-header">
        <div class="test-header__left">
          <button type="button" class="test-header__home" (click)="goBack()" aria-label="Назад">←</button>
          <div class="test-header__title-wrap">
            <input
              type="text"
              class="test-header__title-input"
              [(ngModel)]="draft.testName"
              placeholder="Название теста"
            />
          </div>
        </div>

        <a routerLink="/teacher" class="test-header__home test-header__home--right" aria-label="На главную">⌂</a>
      </header>

      <div class="test-msg test-msg--error" *ngIf="pageError">{{ pageError }}</div>
      <div class="test-msg test-msg--success" *ngIf="successMsg">{{ successMsg }}</div>

      <main class="test-main" *ngIf="!pageLoading">
        <section class="test-col">
          <h2 class="test-col__heading">Задачи теста</h2>
          <div class="test-scroll">
            <div class="test-chip-row" *ngFor="let t of draft.selectedTasks; let i = index">
              <div class="test-chip-row__body">
                <span class="test-chip-row__label">Задача {{ i + 1 }}</span>
                <span class="test-chip-row__name">{{ t.assignmentName }} — {{ t.taskName }}</span>
                <span class="test-chip-row__meta"
                  >{{ t.solveTimeMinutes != null ? t.solveTimeMinutes + ' мин' : 'без лимита' }}, попыток:
                  {{ t.maxAttempts }}, варианты: {{ t.individualVariants ? 'индив.' : 'общие' }}</span
                >
              </div>
              <button type="button" class="test-chip-row__remove" (click)="removeTask(i)" aria-label="Удалить">×</button>
            </div>
            <p class="test-col__empty" *ngIf="draft.selectedTasks.length === 0">Добавьте хотя бы одну задачу.</p>
          </div>
          <div class="test-add-row">
            <a [routerLink]="addTaskLink" class="test-btn test-btn--primary test-btn--link">Добавить задачу</a>
          </div>
        </section>

        <section class="test-col test-col--groups">
          <h2 class="test-col__heading">Группа</h2>
          <p class="test-col__groups-hint">Добавьте группы получателей.</p>
          <div class="test-groups-select-wrap">
            <select class="test-select" [(ngModel)]="groupPickId">
              <option [ngValue]="null">Выберите группу…</option>
              <option *ngFor="let g of availableGroups()" [ngValue]="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div class="test-scroll">
            <div class="test-chip-row" *ngFor="let g of draft.selectedGroups">
              <span class="test-chip-row__name">{{ g.name }}</span>
              <button type="button" class="test-chip-row__remove" (click)="removeGroup(g.id)" aria-label="Удалить">×</button>
            </div>
          </div>
          <div class="test-add-row test-add-row--groups-footer">
            <button type="button" class="test-btn test-btn--primary" (click)="addGroup()">Добавить</button>
          </div>
        </section>

        <section class="test-col test-col--settings">
          <h2 class="test-col__heading">Параметры</h2>
          <div class="test-col-settings__body">
            <label class="test-field">
              <span class="test-field__label">Дата начала</span>
              <input type="datetime-local" class="test-field__input" [(ngModel)]="draft.startLocal" />
            </label>
            <label class="test-field">
              <span class="test-field__label">Дата окончания</span>
              <input type="datetime-local" class="test-field__input" [(ngModel)]="draft.endLocal" />
            </label>
            <label class="test-field">
              <span class="test-field__label">Общее ограничение по времени (мин.)</span>
              <input
                type="number"
                class="test-field__input"
                [(ngModel)]="draft.totalTimeMinutes"
                min="1"
                placeholder="необязательно"
              />
            </label>
            <label class="test-check test-check--custom">
              <input type="checkbox" class="test-check__input" [(ngModel)]="draft.allowLate" />
              <span class="test-check__box" aria-hidden="true"></span>
              <span class="test-check__text">Возможность прохождения после дедлайна</span>
            </label>
          </div>
        </section>
      </main>

      <div class="test-loading" *ngIf="pageLoading">Загрузка…</div>

      <footer class="test-footer" *ngIf="!pageLoading">
        <div class="test-footer__row">
          <button type="button" class="test-footer__btn test-footer__btn--primary" (click)="submit('draft')" [disabled]="saving">
            Сохранить
          </button>
          <button type="button" class="test-footer__btn test-footer__btn--primary" (click)="submit('active')" [disabled]="saving">
            Отправить задание
          </button>
        </div>
        <button type="button" class="test-footer__btn test-footer__btn--danger" (click)="deleteDraft()" [disabled]="saving">
          Удалить
        </button>
      </footer>
    </div>
  `,
  styles: [
    `
      .test-layout {
        box-sizing: border-box;
        min-height: 100vh;
        min-height: 100dvh;
        padding: 1.25em 1.5em 1.75em;
        font-size: clamp(16px, 0.65vw + 12px, 24px);
        line-height: 1.45;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
        display: flex;
        flex-direction: column;
      }

      .test-header {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1em;
        gap: 0.85em;
        flex-wrap: wrap;
      }

      .test-header__left {
        display: flex;
        align-items: stretch;
        gap: 0.6em;
        flex: 1 1 auto;
        min-width: 0;
      }

      .test-header__home {
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
        align-self: flex-start;
        padding: 0;
        cursor: pointer;
        font-family: inherit;
      }
      .test-header__home--right { margin-left: auto; }

      .test-header__home:hover {
        background: #f5f6fb;
        border-color: #b2b9ee;
      }

      .test-header__title-wrap {
        flex: 1 1 auto;
        min-width: 0;
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.55em 0.9em;
        display: flex;
        align-items: center;
      }

      .test-header__title-input {
        width: 100%;
        border: 0;
        outline: 0;
        font-size: 1.15em;
        font-weight: 600;
        color: #111827;
        font-family: inherit;
      }

      .test-header__title-input::placeholder {
        color: #9ca3af;
        font-weight: 500;
      }

      .test-header__user-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 2.5em;
        flex-shrink: 0;
      }

      .test-header__avatar {
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

      .test-header__avatar-img {
        width: 1.35em;
        height: 1.35em;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5b6b8a;
      }
      .test-header__avatar-img svg {
        width: 100%;
        height: 100%;
      }

      .test-header__menu {
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

      .test-header__menu-name {
        font-size: 0.95em;
        font-weight: 600;
        color: #0f172a;
      }

      .test-header__menu-role {
        font-size: 0.85em;
        color: #475569;
      }

      .test-header__menu-item {
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

      .test-header__menu-item:hover {
        background: #cbd5e1;
        color: #0f172a;
      }

      .test-msg {
        margin: 0 0 0.75em;
        padding: 0.55em 0.75em;
        border-radius: 0.45em;
        font-size: 0.95em;
      }

      .test-msg--error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .test-msg--success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
      }

      .test-main {
        flex: 1 1 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: minmax(0, 1fr);
        gap: 1em;
        align-items: stretch;
        min-height: 0;
        margin-bottom: 1.1em;
        overflow-y: auto;
      }

      .test-col {
        background: #fff;
        border: 1px solid #d1d5e6;
        border-radius: 0.55em;
        padding: 0.85em 1em;
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        height: 100%;
      }

      .test-col--settings {
        gap: 0.65em;
        min-height: 0;
      }

      .test-col-settings__body {
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: clamp(0.65em, 2.2vh, 1.35em);
      }

      .test-col__heading {
        margin: 0 0 0.35em;
        font-size: 1.05em;
        font-weight: 600;
        color: #111827;
        flex-shrink: 0;
      }

      .test-col__empty {
        margin: 0.5em 0;
        font-size: 0.92em;
        color: #9ca3af;
      }

      .test-scroll {
        flex: 1 1 auto;
        min-height: 8em;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        margin-bottom: 0.65em;
        padding-right: 0.25em;
        -webkit-overflow-scrolling: touch;
      }

      .test-col--groups .test-scroll {
        flex: 1 1 0;
        margin-bottom: 0;
        min-height: 0;
      }

      .test-col__groups-hint {
        margin: 0 0 0.55em;
        font-size: 0.92em;
        color: #64748b;
        line-height: 1.35;
        flex-shrink: 0;
      }

      .test-groups-select-wrap {
        flex-shrink: 0;
        margin-bottom: 0.65em;
      }

      .test-add-row--groups-footer {
        margin-top: auto;
        flex-shrink: 0;
        padding-top: 0.5em;
      }

      .test-chip-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5em;
        padding: 0.55em 0.65em;
        border: 1px solid #d1d5e6;
        border-radius: 0.5em;
        background: #fafbfe;
      }

      .test-chip-row__body {
        display: flex;
        flex-direction: column;
        gap: 0.15em;
        min-width: 0;
      }

      .test-chip-row__label {
        font-size: 0.88em;
        font-weight: 700;
        color: #111827;
      }

      .test-chip-row__name {
        font-size: 0.92em;
        color: #374151;
        word-break: break-word;
      }

      .test-chip-row__meta {
        font-size: 0.8em;
        color: #64748b;
      }

      .test-chip-row__remove {
        flex-shrink: 0;
        width: 1.65em;
        height: 1.65em;
        border-radius: 0.35em;
        border: 1px solid #cbd5e1;
        background: #fff;
        cursor: pointer;
        font-size: 1.1em;
        line-height: 1;
        color: #64748b;
        padding: 0;
      }

      .test-chip-row__remove:hover {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #b91c1c;
      }

      .test-add-row {
        display: flex;
        flex-direction: column;
        gap: 0.45em;
        flex-shrink: 0;
      }

      .test-select {
        width: 100%;
        padding: 0.55em 0.65em;
        border: 1px solid #d1d5e6;
        border-radius: 0.5em;
        font-size: 0.95em;
        background: #fff;
        font-family: inherit;
      }

      .test-btn {
        padding: 0.55em 0.85em;
        border-radius: 0.5em;
        border: 0;
        font-size: 0.95em;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
      }

      .test-btn--primary {
        background: #a5c8ff;
        color: #1e3a5f;
      }

      .test-btn--primary:hover:not(:disabled) {
        background: #8bb8ff;
      }

      a.test-btn--link {
        display: block;
        text-align: center;
        text-decoration: none;
        box-sizing: border-box;
      }

      /* Блок формы переопределяет базовый стиль label для текущего макета. */
      .test-field {
        display: flex;
        flex-direction: column;
        gap: 0.4em;
        font-size: inherit;
        margin-bottom: 0;
        color: inherit;
      }

      .test-field__label {
        font-size: 0.88em;
        color: #475569;
        font-weight: 500;
      }

      .test-field__input {
        padding: 0.55em 0.65em;
        border: 1px solid #d1d5e6;
        border-radius: 0.5em;
        font-size: 0.95em;
        font-family: inherit;
        width: 100%;
        box-sizing: border-box;
      }

      .test-col--settings .test-field__label {
        font-size: 0.98em;
        color: #334155;
        font-weight: 600;
      }

      .test-col--settings .test-field__input {
        font-size: 1.05em;
        padding: 0.65em 0.75em;
        min-height: 2.85em;
        border-radius: 0.55em;
      }

      .test-check--custom {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.65em;
        margin: 0;
        padding: 0.35em 0;
        cursor: pointer;
        font-size: 0.98em;
        font-weight: 600;
        color: #334155;
        line-height: 1.4;
        flex-shrink: 0;
      }

      .test-check--custom .test-check__input {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 1.45em;
        height: 1.45em;
        margin: 0;
        opacity: 0;
        cursor: pointer;
        z-index: 2;
      }

      .test-check__box {
        flex-shrink: 0;
        width: 1.35em;
        height: 1.35em;
        border-radius: 0.4em;
        border: 2px solid #94a3b8;
        background: #fff;
        box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        pointer-events: none;
      }

      .test-check__input:focus-visible + .test-check__box {
        box-shadow: 0 0 0 3px rgba(91, 124, 255, 0.35);
        border-color: #5b7cff;
      }

      .test-check__input:checked + .test-check__box {
        background: linear-gradient(145deg, #5b7cff, #3b5bdb);
        border-color: #3b5bdb;
        box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.12);
      }

      .test-check__input:checked + .test-check__box::after {
        content: '';
        width: 0.32em;
        height: 0.55em;
        border: solid #fff;
        border-width: 0 0.14em 0.14em 0;
        transform: rotate(45deg) translate(-0.04em, -0.06em);
      }

      .test-check__text {
        flex: 1;
        min-width: 0;
        padding-top: 0.02em;
      }

      .test-loading {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
      }

      .test-footer {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 0.55em;
        width: 100%;
        max-width: none;
        margin: 0;
      }

      .test-footer__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.55em;
        width: 100%;
      }

      .test-footer__row .test-footer__btn {
        width: 100%;
        min-width: 0;
      }

      .test-footer__btn {
        padding: 0.65em 1em;
        border-radius: 0.55em;
        border: 0;
        font-size: 1em;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        width: 100%;
        box-sizing: border-box;
      }

      .test-footer__btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .test-footer__btn--primary {
        background: #a5c8ff;
        color: #1e3a5f;
      }

      .test-footer__btn--primary:hover:not(:disabled) {
        background: #8bb8ff;
      }

      .test-footer__btn--danger {
        background: #fecaca;
        color: #7f1d1d;
      }

      .test-footer__btn--danger:hover:not(:disabled) {
        background: #fca5a5;
      }

      @media (max-width: 960px) {
        .test-main {
          grid-template-columns: 1fr;
          grid-template-rows: none;
          align-content: start;
        }

        .test-col {
          height: auto;
          min-height: min(48vh, 18em);
        }

        .test-col-settings__body {
          justify-content: flex-start;
          gap: 0.85em;
        }
      }

      @media (max-width: 640px) {
        .test-header {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
/**
 * Компонент создания и редактирования теста.
 */
export class TestCreateComponent implements OnInit {
  allGroups: GroupDto[] = [];

  groupPickId: number | null = null;

  pageLoading = true;
  saving = false;
  pageError = '';
  successMsg = '';

  userMenuOpen = false;
  userDisplayName = 'Преподаватель';
  userRoleLabel = 'Преподаватель';

  constructor(
    readonly draft: TestCreateDraftService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  /**
   * Формирует ссылку на страницу добавления задачи.
   */
  get addTaskLink(): (string | number)[] {
    if (this.draft.editingTestId != null) {
      return ['/teacher', 'tests', this.draft.editingTestId, 'edit', 'add-task'];
    }
    return ['/teacher', 'tests', 'new', 'add-task'];
  }

  /**
   * Инициализирует страницу и проверяет роль текущего пользователя.
   */
  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => {
        this.userDisplayName = user.fullName?.trim() || 'Преподаватель';
        this.userRoleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Студент';
        if (user.role !== 'teacher') {
          this.router.navigateByUrl('/login');
          return;
        }
        this.route.paramMap.subscribe(() => {
          this.pageError = '';
          this.successMsg = '';
          this.loadPageData();
        });
      },
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  /**
   * Загружает исходные данные страницы в режиме создания или редактирования.
   */
  private loadPageData(): void {
    const testIdStr = this.route.snapshot.paramMap.get('testId');
    const editId = testIdStr ? Number(testIdStr) : NaN;
    if (Number.isFinite(editId) && editId > 0) {
      this.loadTestForEdit(editId);
      return;
    }
    if (this.draft.editingTestId != null) {
      this.draft.reset();
    }
    this.draft.ensureDefaultDatesIfEmpty();
    this.auth.getGroups().subscribe({
      next: (g) => {
        this.allGroups = g;
        this.pageLoading = false;
      },
      error: () => {
        this.allGroups = [];
        this.pageLoading = false;
      },
    });
  }

  /**
   * Загружает тест и группы для режима редактирования.
   */
  private loadTestForEdit(testId: number): void {
    this.pageError = '';
    if (this.draft.skipNextEditReload && this.draft.editingTestId === testId) {
      this.draft.skipNextEditReload = false;
      this.pageLoading = true;
      this.auth.getGroups().subscribe({
        next: (g) => {
          this.allGroups = g;
          this.pageLoading = false;
        },
        error: () => {
          this.allGroups = [];
          this.pageLoading = false;
        },
      });
      return;
    }
    this.pageLoading = true;
    forkJoin({ groups: this.auth.getGroups(), detail: this.auth.getTest(testId) }).subscribe({
      next: ({ groups, detail }) => {
        this.allGroups = groups;
        this.draft.applyFromDetail(detail);
        this.pageLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.pageLoading = false;
        this.allGroups = [];
        if (err.status === 401) {
          void this.router.navigateByUrl('/login');
          return;
        }
        if (err.status === 404) {
          void this.router.navigateByUrl('/teacher/tests/saved');
          return;
        }
        this.pageError = 'Не удалось загрузить тест.';
      },
    });
  }

  /**
   * Преобразует значение datetime-local в строку локальной даты для API.
   */
  private localToIso(local: string): string | null {
    if (!local) return null;
    const base = local.length >= 19 ? local.slice(0, 19) : local.length === 16 ? `${local}:00` : '';
    if (!base || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(base)) return null;
    return base;
  }

  /**
   * Возвращает группы, еще не добавленные в тест.
   */
  availableGroups(): GroupDto[] {
    const taken = new Set(this.draft.selectedGroups.map((g) => g.id));
    return this.allGroups.filter((g) => !taken.has(g.id));
  }

  /**
   * Удаляет задачу из списка выбранных задач.
   */
  removeTask(index: number): void {
    this.draft.selectedTasks.splice(index, 1);
  }

  /**
   * Добавляет выбранную группу в список получателей теста.
   */
  addGroup(): void {
    if (this.groupPickId == null) return;
    const g = this.allGroups.find((x) => x.id === this.groupPickId);
    if (!g) return;
    this.draft.selectedGroups.push({ id: g.id, name: g.name });
    this.groupPickId = null;
  }

  /**
   * Удаляет группу из списка получателей теста.
   */
  removeGroup(id: number): void {
    this.draft.selectedGroups = this.draft.selectedGroups.filter((g) => g.id !== id);
  }

  /**
   * Удаляет тест или очищает черновик в режиме создания.
   */
  deleteDraft(): void {
    this.pageError = '';
    this.successMsg = '';
    this.groupPickId = null;
    const editId = this.draft.editingTestId;
    if (editId != null) {
      this.saving = true;
      this.auth.deleteTest(editId).subscribe({
        next: () => {
          this.saving = false;
          this.draft.reset();
          void this.router.navigate(['/teacher', 'tests', 'saved']);
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          const msg = err?.error?.message ?? err?.message ?? 'Не удалось удалить тест';
          this.pageError = typeof msg === 'string' ? msg : 'Не удалось удалить тест';
          if (err.status === 401) void this.router.navigateByUrl('/login');
        },
      });
      return;
    }
    this.draft.reset();
  }

  /**
   * Валидирует форму и сохраняет тест в указанном статусе.
   */
  submit(status: 'draft' | 'active'): void {
    this.pageError = '';
    this.successMsg = '';

    const name = this.draft.testName.trim();
    if (!name) {
      this.pageError = 'Укажите название теста.';
      return;
    }
    if (this.draft.selectedTasks.length === 0) {
      this.pageError = 'Добавьте хотя бы одну задачу.';
      return;
    }
    if (this.draft.selectedGroups.length === 0) {
      this.pageError = 'Добавьте хотя бы одну группу.';
      return;
    }

    const startIso = this.localToIso(this.draft.startLocal);
    const endIso = this.localToIso(this.draft.endLocal);
    if (!startIso || !endIso) {
      this.pageError = 'Укажите корректные даты начала и окончания.';
      return;
    }

    let totalTimeMinutes: number | null = null;
    const limit = this.draft.totalTimeMinutes;
    if (limit != null) {
      const n = Number(limit);
      if (!Number.isFinite(n) || n < 1) {
        this.pageError = 'Ограничение по времени должно быть положительным числом или пустым.';
        return;
      }
      totalTimeMinutes = Math.round(n);
    }

    const body = {
      name,
      groupIds: this.draft.selectedGroups.map((g) => g.id),
      questions: this.draft.selectedTasks.map((t) => ({
        assignmentId: t.assignmentId,
        assignmentTaskId: t.assignmentTaskId,
        maxAttempts: t.maxAttempts,
        solveTimeMinutes: t.solveTimeMinutes,
        individualVariants: t.individualVariants,
      })),
      startDate: startIso,
      endDate: endIso,
      totalTimeMinutes,
      allowLateSubmission: this.draft.allowLate,
      status,
    };

    this.saving = true;
    const req$ =
      this.draft.editingTestId != null
        ? this.auth.updateTest(this.draft.editingTestId, body)
        : this.auth.createTest(body);

    req$.subscribe({
      next: (res) => {
        this.saving = false;
        if (this.draft.editingTestId != null) {
          this.successMsg = status === 'draft' ? 'Черновик сохранён' : 'Задание обновлено';
        } else {
          this.draft.reset();
          const label = status === 'draft' ? 'Черновик сохранён' : 'Задание отправлено';
          this.successMsg = `${label} (№ ${res.id}).`;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        const msg = err?.error?.message ?? err?.message ?? 'Не удалось сохранить';
        this.pageError = typeof msg === 'string' ? msg : 'Не удалось сохранить';
        if (err.status === 401) this.router.navigateByUrl('/login');
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
   * Возвращает пользователя к списку сохраненных тестов.
   */
  goBack(): void {
    void this.router.navigateByUrl('/teacher/tests/saved');
  }

  /**
   * Выполняет выход пользователя из системы.
   */
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
  }
}
