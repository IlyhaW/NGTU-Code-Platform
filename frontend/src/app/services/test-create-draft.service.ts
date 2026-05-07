import { Injectable } from '@angular/core';
import type { TestDetailDto } from '../api.types';

export interface TestDraftSelectedTask {
  assignmentId: number;
  assignmentTaskId: number;
  assignmentName: string;
  taskName: string;
  maxAttempts: number;
  solveTimeMinutes: number | null;
  individualVariants: boolean;
}

export interface TestDraftSelectedGroup {
  id: number;
  name: string;
}

/**
 * Преобразует дату в формат для input datetime-local.
 */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Преобразует ISO-дату в формат для input datetime-local.
 */
export function isoToDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const s = iso.replace(/Z$/, '').replace(/\.\d{3,}/, '');
  return s.length >= 16 ? s.slice(0, 16) : s;
}

@Injectable({ providedIn: 'root' })
/**
 * Хранит черновик формы создания и редактирования теста.
 */
export class TestCreateDraftService {
  testName = '';
  selectedTasks: TestDraftSelectedTask[] = [];
  selectedGroups: TestDraftSelectedGroup[] = [];
  startLocal = '';
  endLocal = '';
  /**
   * Общее ограничение времени в минутах.
   */
  totalTimeMinutes: number | null = null;
  allowLate = false;
  /**
   * Идентификатор теста в режиме редактирования.
   */
  editingTestId: number | null = null;
  /**
   * Флаг пропуска перезагрузки черновика после возврата из подбора задач.
   */
  skipNextEditReload = false;

  /**
   * Заполняет даты значениями по умолчанию, если они не заданы.
   */
  ensureDefaultDatesIfEmpty(): void {
    if (!this.startLocal || !this.endLocal) {
      const now = new Date();
      const inWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (!this.startLocal) this.startLocal = toDatetimeLocal(now);
      if (!this.endLocal) this.endLocal = toDatetimeLocal(inWeek);
    }
  }

  /**
   * Заполняет черновик данными существующего теста.
   */
  applyFromDetail(d: TestDetailDto): void {
    this.skipNextEditReload = false;
    this.editingTestId = d.id;
    this.testName = d.name;
    this.selectedTasks = d.questions.map((q) => ({
      assignmentId: q.assignmentId,
      assignmentTaskId: q.assignmentTaskId,
      assignmentName: q.assignmentName,
      taskName: q.taskName,
      maxAttempts: q.maxAttempts,
      solveTimeMinutes: q.solveTimeMinutes,
      individualVariants: q.individualVariants,
    }));
    this.selectedGroups = d.groups.map((g) => ({ id: g.id, name: g.name }));
    this.startLocal = isoToDatetimeLocal(d.startDate);
    this.endLocal = isoToDatetimeLocal(d.endDate);
    const t = d.totalTimeMinutes;
    this.totalTimeMinutes = t != null && t > 0 ? t : null;
    this.allowLate = d.allowLateSubmission;
  }

  /**
   * Полностью очищает черновик и выставляет новые даты по умолчанию.
   */
  reset(): void {
    this.skipNextEditReload = false;
    this.editingTestId = null;
    this.testName = '';
    this.selectedTasks = [];
    this.selectedGroups = [];
    this.totalTimeMinutes = null;
    this.allowLate = false;
    const now = new Date();
    const inWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.startLocal = toDatetimeLocal(now);
    this.endLocal = toDatetimeLocal(inWeek);
  }
}
