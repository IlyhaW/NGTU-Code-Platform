import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

type JwtPayload = {
  role?: string;
  exp?: number;
};

/**
 * Декодирует payload JWT-токена без проверки подписи.
 */
function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Проверяет наличие токена и срок его действия.
 */
function hasValidToken(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 > Date.now();
}

/**
 * Проверяет соответствие роли пользователя ожидаемой роли.
 */
function hasRole(expectedRole: string): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const payload = parseJwtPayload(token);
  return (payload?.role ?? '').toLowerCase() === expectedRole.toLowerCase();
}

/**
 * Общий guard проверки аутентификации.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (!hasValidToken()) {
    localStorage.removeItem('token');
    return router.createUrlTree(['/login']);
  }
  return true;
};

/**
 * Guard доступа к разделам преподавателя.
 */
export const teacherGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (!hasValidToken()) {
    localStorage.removeItem('token');
    return router.createUrlTree(['/login']);
  }
  if (!hasRole('teacher')) {
    return router.createUrlTree(['/student']);
  }
  return true;
};

/**
 * Guard доступа к разделам студента.
 */
export const studentGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (!hasValidToken()) {
    localStorage.removeItem('token');
    return router.createUrlTree(['/login']);
  }
  if (!hasRole('student')) {
    return router.createUrlTree(['/teacher']);
  }
  return true;
};
