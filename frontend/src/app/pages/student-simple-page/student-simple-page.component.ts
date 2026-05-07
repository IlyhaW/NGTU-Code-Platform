import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data, RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-simple-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="student-page">
      <a [routerLink]="backLink" class="student-page__back">{{ backLabel }}</a>
      <h1 class="student-page__title">{{ title }}</h1>
      <p class="student-page__text">{{ subtitle }}</p>
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

      .student-page {
        flex: 1 1 auto;
        min-height: 0;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #d1d5e6;
        padding: 20px 22px 24px;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        box-sizing: border-box;
      }

      .student-page__back {
        display: inline-block;
        margin-bottom: 16px;
        font-size: 14px;
        color: #2563eb;
        text-decoration: none;
      }

      .student-page__back:hover {
        text-decoration: underline;
      }

      .student-page__title {
        margin: 0 0 12px;
        font-size: 20px;
        font-weight: 600;
        color: #111827;
      }

      .student-page__text {
        margin: 0;
        font-size: 14px;
        line-height: 1.45;
        color: #64748b;
      }
    `,
  ],
})
/**
 * Компонент простой информационной страницы студента.
 */
export class StudentSimplePageComponent {
  title = '';
  subtitle = '';
  backLink = '/student';
  backLabel = '← На главную студента';

  constructor(private readonly route: ActivatedRoute) {
    this.applyData(this.route.snapshot.data);
    this.route.data.subscribe((d) => this.applyData(d));
  }

  /**
   * Применяет данные маршрута к содержимому страницы.
   */
  private applyData(d: Data): void {
    this.title = (d['title'] as string) ?? '';
    this.subtitle = (d['subtitle'] as string) ?? '';
    if (d['backLink'] != null) this.backLink = String(d['backLink']);
    else this.backLink = '/student';
    if (d['backLabel'] != null) this.backLabel = d['backLabel'] as string;
    else this.backLabel = '← На главную студента';
  }
}
