import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../api.types';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__badge">NGTU code - platform</div>
          <h1 class="auth-card__title">Вход в аккаунт</h1>
          <p class="auth-card__subtitle">Введите email и пароль, чтобы продолжить работу в системе.</p>
        </header>

        <div class="auth-card__body">
          <div class="auth-card__error" *ngIf="error">Ошибка: {{ error }}</div>

          <form class="auth-form" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="auth-form__field">
              <label>Email</label>
              <input formControlName="login" autocomplete="username" />
            </div>

            <div class="auth-form__field">
              <label>Пароль</label>
              <input type="password" formControlName="password" autocomplete="current-password" />
            </div>

            <button class="auth-form__submit" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Входим…' : 'Войти' }}
            </button>
          </form>
        </div>

        <footer class="auth-card__footer">
          <span>Нет аккаунта?</span>
          <a routerLink="/register">Зарегистрироваться</a>
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
        max-width: 520px;
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
        gap: 12px;
      }

      .auth-form__field label {
        display: block;
        margin-bottom: 4px;
        font-size: 13px;
        color: #374151;
      }

      .auth-form__field input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #cfd5ea;
        outline: none;
      }

      .auth-form__submit {
        margin-top: 4px;
        width: 100%;
        padding: 10px 14px;
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

      @media (max-width: 480px) {
        .auth-card {
          padding: 18px 18px 16px;
        }
      }
    `,
  ],
})
/**
 * Компонент страницы входа в систему.
 */
export class LoginComponent {
  loading = false;
  error = '';

  form = new FormGroup({
    login: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Извлекает роль пользователя из ответа авторизации.
   */
  private getRoleFromLoginResponse(res: LoginResponse): string {
    const fromResponse = (res as { role?: string }).role;
    if (fromResponse != null && fromResponse !== '') {
      return fromResponse.toLowerCase().trim();
    }
    try {
      const token = res.token;
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const fromToken = payload?.role;
        if (fromToken != null && fromToken !== '') {
          return String(fromToken).toLowerCase().trim();
        }
      }
    } catch {
      /* Ошибки декодирования JWT игнорируются. */
    }
    return 'student';
  }

  /**
   * Выполняет отправку формы входа.
   */
  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.loading = false;
        const role = this.getRoleFromLoginResponse(res);
        if (role === 'teacher') {
          this.router.navigateByUrl('/teacher');
        } else {
          this.router.navigateByUrl('/student');
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Ошибка соединения с сервером';
      },
    });
  }
}

