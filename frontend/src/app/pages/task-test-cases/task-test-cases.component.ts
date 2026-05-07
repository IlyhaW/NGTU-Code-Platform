import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskTestCasesViewDto } from '../../api.types';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-task-test-cases',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="cases-layout">
      <header class="cases-header">
        <button type="button" class="cases-header__nav" (click)="goBack()" aria-label="Назад">←</button>
        <div class="cases-header__title-box">
          <h1 class="cases-header__title">Тест-кейсы</h1>
        </div>
        <a routerLink="/teacher" class="cases-header__nav" aria-label="На главную">⌂</a>
      </header>

      <div *ngIf="loading" class="cases-msg">Загрузка...</div>
      <div *ngIf="error" class="cases-msg cases-msg--error">{{ error }}</div>

      <main *ngIf="!loading && !error && data" class="cases-main">
        <section class="cases-task">
          <h2 class="cases-task__title">{{ data.taskTitle }}</h2>
          <p class="cases-task__variant">{{ data.variantName }}</p>
          <div class="cases-task__content">{{ data.variantContent || 'Текст варианта не заполнен.' }}</div>
        </section>

        <section class="cases-grid">
          <article class="cases-col">
            <h3 class="cases-col__title">Открытые тест-кейсы</h3>
            <p class="cases-col__hint">Эти входные/выходные данные будут видны студенту.</p>
            <div class="cases-add">
              <textarea class="cases-add__area" [(ngModel)]="newOpenInput" placeholder="Входные данные"></textarea>
              <textarea class="cases-add__area" [(ngModel)]="newOpenOutput" placeholder="Выходные данные"></textarea>
              <button type="button" class="cases-add__btn" (click)="addCase(true)" [disabled]="addingOpen">Добавить открытый кейс</button>
            </div>
            <div class="cases-list">
              <div *ngIf="!data.openCases.length" class="cases-empty">Пока нет открытых кейсов.</div>
              <div *ngFor="let c of data.openCases; let i = index" class="cases-item">
                <div class="cases-item__head">
                  <div class="cases-item__n">Кейс {{ i + 1 }}</div>
                  <button type="button" class="cases-item__delete" (click)="deleteCase(c.id)" aria-label="Удалить кейс">×</button>
                </div>
                <div class="cases-item__row">
                  <div class="cases-item__k">Вход</div>
                  <div class="cases-item__v">{{ c.inputData || '(пусто)' }}</div>
                </div>
                <div class="cases-item__row">
                  <div class="cases-item__k">Выход</div>
                  <div class="cases-item__v">{{ c.expectedOutput || '(пусто)' }}</div>
                </div>
              </div>
            </div>
          </article>

          <article class="cases-col">
            <h3 class="cases-col__title">Закрытые тест-кейсы</h3>
            <p class="cases-col__hint">Эти кейсы использует только система проверки.</p>
            <div class="cases-add">
              <textarea class="cases-add__area" [(ngModel)]="newHiddenInput" placeholder="Входные данные"></textarea>
              <textarea class="cases-add__area" [(ngModel)]="newHiddenOutput" placeholder="Выходные данные"></textarea>
              <button type="button" class="cases-add__btn" (click)="addCase(false)" [disabled]="addingHidden">Добавить закрытый кейс</button>
            </div>
            <div class="cases-list">
              <div *ngIf="!data.hiddenCases.length" class="cases-empty">Пока нет закрытых кейсов.</div>
              <div *ngFor="let c of data.hiddenCases; let i = index" class="cases-item">
                <div class="cases-item__head">
                  <div class="cases-item__n">Кейс {{ i + 1 }}</div>
                  <button type="button" class="cases-item__delete" (click)="deleteCase(c.id)" aria-label="Удалить кейс">×</button>
                </div>
                <div class="cases-item__row">
                  <div class="cases-item__k">Вход</div>
                  <div class="cases-item__v">{{ c.inputData || '(пусто)' }}</div>
                </div>
                <div class="cases-item__row">
                  <div class="cases-item__k">Выход</div>
                  <div class="cases-item__v">{{ c.expectedOutput || '(пусто)' }}</div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .cases-layout {
      position: fixed; inset: 0; background: #eef1ff; box-sizing: border-box;
      padding: 0.95em 1.35em 1em; font-size: clamp(15px, 0.55vw + 12px, 22px);
      display: flex; flex-direction: column; min-height: 0; overflow: hidden;
    }
    .cases-header { display: flex; align-items: center; justify-content: space-between; gap: 0.75em; margin-bottom: 0.85em; }
    .cases-header__nav {
      width: 2.75em; height: 2.75em; border-radius: 0.55em; border: 1px solid #d1d5e6; background: #fff;
      font-size: 1.15em; display: flex; align-items: center; justify-content: center; text-decoration: none; color: #374151; cursor: pointer;
    }
    .cases-header__title-box { background: #fff; border: 1px solid #d1d5e6; border-radius: 0.55em; padding: 0.5em 0.9em; }
    .cases-header__title { margin: 0; font-size: 1.05em; color: #0f172a; }
    .cases-main { display: flex; flex-direction: column; gap: 0.9em; min-height: 0; flex: 1 1 auto; }
    .cases-task {
      border: 1px solid #d1d5e6; border-radius: 0.65em; background: #fff; padding: 0.85em 1em;
      display: flex; flex-direction: column; gap: 0.35em; flex-shrink: 0;
    }
    .cases-task__title { margin: 0; font-size: 1.08em; color: #0f172a; }
    .cases-task__variant { margin: 0; font-size: 0.9em; color: #475569; }
    .cases-task__content {
      margin: 0; white-space: pre-wrap; border: 1px solid #e2e8f0; border-radius: 0.5em; background: #f8fafc;
      padding: 0.65em 0.75em; color: #334155; max-height: 8.5em; overflow: auto;
    }
    .cases-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9em; min-height: 0; flex: 1 1 auto; }
    .cases-col {
      border: 1px solid #d1d5e6; border-radius: 0.65em; background: #fff; padding: 0.85em;
      display: flex; flex-direction: column; min-height: 0;
    }
    .cases-col__title { margin: 0; font-size: 0.98em; color: #0f172a; }
    .cases-col__hint { margin: 0.2em 0 0.6em; font-size: 0.82em; color: #64748b; }
    .cases-add {
      border: 1px solid #dbe4f3; border-radius: 0.55em; background: #f8fbff;
      padding: 0.5em; margin-bottom: 0.6em; display: flex; flex-direction: column; gap: 0.4em;
      flex-shrink: 0;
    }
    .cases-add__area {
      width: 100%; box-sizing: border-box; min-height: 3.4em; border: 1px solid #cbd5e1; border-radius: 0.45em;
      padding: 0.45em 0.55em; resize: none; font: inherit; font-size: 0.84em; background: #fff;
    }
    .cases-add__btn {
      width: 100%; padding: 0.58em 0.85em; border-radius: 0.5em; border: 0; background: #a5c8ff; color: #1e3a5f;
      font: inherit; font-size: 0.86em; font-weight: 600; cursor: pointer;
    }
    .cases-add__btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .cases-list { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 0.55em; }
    .cases-item { border: 1px solid #e2e8f0; border-radius: 0.5em; background: #f8fafc; padding: 0.55em 0.6em; }
    .cases-item__head { display: flex; align-items: center; justify-content: space-between; gap: 0.5em; margin-bottom: 0.3em; }
    .cases-item__n { font-size: 0.82em; font-weight: 600; color: #334155; }
    .cases-item__delete {
      width: 1.7em; height: 1.7em; border: 0; border-radius: 0.35em; background: transparent; color: #dc2626;
      font-size: 1.1em; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .cases-item__delete:hover { background: rgba(220, 38, 38, 0.1); color: #b91c1c; }
    .cases-item__row { display: grid; grid-template-columns: 3.6em 1fr; gap: 0.45em; margin-bottom: 0.25em; }
    .cases-item__row:last-child { margin-bottom: 0; }
    .cases-item__k { font-size: 0.8em; color: #64748b; text-transform: uppercase; }
    .cases-item__v { white-space: pre-wrap; color: #1f2937; font-size: 0.88em; }
    .cases-empty { border: 1px dashed #cbd5e1; border-radius: 0.5em; background: #f8fafc; color: #64748b; padding: 0.8em; font-size: 0.9em; }
    .cases-msg { color: #64748b; font-size: 0.95em; }
    .cases-msg--error { color: #b91c1c; }
    @media (max-width: 980px) { .cases-grid { grid-template-columns: 1fr; } }
  `],
})
/**
 * Компонент управления тест-кейсами задачи.
 */
export class TaskTestCasesComponent implements OnInit {
  loading = true;
  error = '';
  data: TaskTestCasesViewDto | null = null;
  assignmentId = 0;
  taskId = 0;
  variantId = 0;
  newOpenInput = '';
  newOpenOutput = '';
  newHiddenInput = '';
  newHiddenOutput = '';
  addingOpen = false;
  addingHidden = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  /**
   * Инициализирует страницу и загружает тест-кейсы варианта.
   */
  ngOnInit(): void {
    const aid = Number(this.route.snapshot.paramMap.get('id'));
    const tid = Number(this.route.snapshot.paramMap.get('taskId'));
    const vid = Number(this.route.snapshot.paramMap.get('variantId'));
    if (!Number.isFinite(aid) || !Number.isFinite(tid) || !Number.isFinite(vid)) {
      this.loading = false;
      this.error = 'Некорректная ссылка.';
      return;
    }
    this.assignmentId = aid;
    this.taskId = tid;
    this.variantId = vid;
    this.auth.getTaskTestCases(aid, tid, vid).subscribe({
      next: (dto) => {
        this.data = dto;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) this.router.navigateByUrl('/login');
        else if (err.status === 404) this.error = 'Задача или вариант не найдены.';
        else this.error = 'Не удалось загрузить тест-кейсы.';
      },
    });
  }

  /**
   * Возвращает пользователя на страницу варианта задачи.
   */
  goBack(): void {
    void this.router.navigate(['/teacher/topics', this.assignmentId, 'tasks', this.taskId, 'variants', this.variantId]);
  }

  /**
   * Добавляет открытый или закрытый тест-кейс.
   */
  addCase(isPublic: boolean): void {
    if (!this.data) return;
    const input = isPublic ? this.newOpenInput : this.newHiddenInput;
    const output = isPublic ? this.newOpenOutput : this.newHiddenOutput;
    if (!input.trim() && !output.trim()) {
      return;
    }
    if (isPublic) this.addingOpen = true;
    else this.addingHidden = true;

    this.auth
      .addTaskTestCase(this.assignmentId, this.taskId, this.variantId, {
        inputData: input,
        expectedOutput: output,
        isPublic,
      })
      .subscribe({
        next: () => {
          if (isPublic) {
            this.newOpenInput = '';
            this.newOpenOutput = '';
            this.addingOpen = false;
          } else {
            this.newHiddenInput = '';
            this.newHiddenOutput = '';
            this.addingHidden = false;
          }
          this.reloadCases();
        },
        error: () => {
          if (isPublic) this.addingOpen = false;
          else this.addingHidden = false;
        },
      });
  }

  /**
   * Перезагружает список тест-кейсов.
   */
  private reloadCases(): void {
    this.auth.getTaskTestCases(this.assignmentId, this.taskId, this.variantId).subscribe({
      next: (dto) => (this.data = dto),
    });
  }

  /**
   * Удаляет тест-кейс по идентификатору.
   */
  deleteCase(testCaseId: number): void {
    this.auth.deleteTaskTestCase(this.assignmentId, this.taskId, this.variantId, testCaseId).subscribe({
      next: () => this.reloadCases(),
    });
  }
}
