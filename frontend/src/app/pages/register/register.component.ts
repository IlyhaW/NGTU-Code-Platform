import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GroupDto } from '../../api.types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__badge">NGTU code - platform</div>
          <h1 class="auth-card__title">Регистрация</h1>
          <p class="auth-card__subtitle">
            Заполните данные, чтобы создать аккаунт студента.
          </p>
        </header>

        <div class="auth-card__body">
          <div class="auth-card__error" *ngIf="error">Ошибка: {{ error }}</div>

          <form class="auth-form" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="auth-form__grid">
              <div class="auth-form__col">
                <div class="auth-form__field">
                  <label>ФИО</label>
                  <input formControlName="fullName" autocomplete="name" />
                </div>

                <div class="auth-form__field">
                  <label>Группа</label>
                  <select formControlName="groupId">
                    <option value="" disabled>Выберите группу</option>
                    <option *ngFor="let g of groups" [value]="g.id">
                      {{ g.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="auth-form__col auth-form__col--right">
                <div class="auth-form__field">
                  <label>Пароль</label>
                  <input type="password" formControlName="password" autocomplete="new-password" />
                </div>

                <div class="auth-form__field">
                  <label>Повторите пароль</label>
                  <input type="password" formControlName="confirmPassword" autocomplete="new-password" />
                </div>
              </div>

              <div class="auth-form__field auth-form__field--full">
                <label>Email</label>
                <input formControlName="login" autocomplete="username" />
              </div>
            </div>

            <button class="auth-form__submit" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Создаём…' : 'Зарегистрироваться' }}
            </button>
          </form>
        </div>

        <footer class="auth-card__footer">
          <span>Уже есть аккаунт?</span>
          <a routerLink="/login">Войти</a>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-layout {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at top left, #eef1ff, #e7eaef);
        padding: 24px;
      }

      .auth-card {
        width: 100%;
        max-width: 720px;
        background: #ffffff;
        border-radius: 20px;
        border: 1px solid #d1d5e6;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
        padding: 22px 26px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .auth-card__header {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .auth-card__badge {
        align-self: flex-start;
        padding: 4px 10px;
        border-radius: 999px;
        background: #edf0ff;
        color: #1f2937;
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-weight: 600;
      }

      .auth-card__title {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: #111827;
      }

      .auth-card__subtitle {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }

      .auth-card__body {
        margin-top: 4px;
      }

      .auth-card__error {
        padding: 10px 12px;
        border-radius: 10px;
        background: #ffecef;
        border: 1px solid #ffd0d8;
        color: #7b0b1a;
        margin-bottom: 12px;
        font-size: 13px;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .auth-form__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 16px;
      }

      .auth-form__col {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .auth-form__col--right {
        justify-content: flex-start;
      }

      .auth-form__field label {
        display: block;
        margin-bottom: 4px;
        font-size: 13px;
        color: #374151;
      }

      .auth-form__field input,
      .auth-form__field select {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #cfd5ea;
        outline: none;
      }

      .auth-form__field--full {
        grid-column: 1 / -1;
      }

      .auth-form__submit {
        align-self: flex-end;
        min-width: 180px;
        padding: 10px 18px;
        border-radius: 10px;
        border: 0;
        background: linear-gradient(135deg, #5b7cff, #2f5bea);
        color: #ffffff;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
      }

      .auth-form__submit:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .auth-card__footer {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        margin-top: 4px;
        font-size: 13px;
        color: #4b5563;
      }

      .auth-card__footer a {
        color: #2f5bea;
        text-decoration: none;
        font-weight: 500;
      }

      .auth-card__footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 640px) {
        .auth-card {
          padding: 18px 18px 16px;
        }

        .auth-form__grid {
          grid-template-columns: 1fr;
        }

        .auth-form__submit {
          width: 100%;
        }
      }
    `,
  ],
})
/**
 * Компонент страницы регистрации пользователя.
 */
export class RegisterComponent implements OnInit {
  loading = false;
  error = '';
  groups: GroupDto[] = [];

  form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    login: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    groupId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Загружает список групп для формы регистрации.
   */
  ngOnInit(): void {
    this.auth.getGroups().subscribe({
      next: (groups) => (this.groups = groups),
      error: () => {
        this.error = 'Не удалось загрузить список групп';
      },
    });
  }

  /**
   * Валидирует и отправляет форму регистрации.
   */
  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    const v = this.form.getRawValue();
    if (v.password !== v.confirmPassword) {
      this.error = 'Пароли не совпадают';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth
      .register({
        fullName: v.fullName,
        login: v.login,
        password: v.password,
        role: 'student',
        groupId: v.groupId ? Number(v.groupId) : null,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl('/login');
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message ?? 'Ошибка соединения с сервером';
        },
      });
  }
}

