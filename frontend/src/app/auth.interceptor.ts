import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Определяет, нужно ли добавлять JWT к запросу.
 */
function shouldAttachToken(url: string): boolean {
  if (!url.includes('/api/auth')) {
    return false;
  }
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  if (path.includes('/login') || path.includes('/register')) {
    return false;
  }
  return true;
}

/**
 * HTTP-interceptor для подстановки JWT и обработки 401-ответов.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  let nextReq = req;
  if (token && shouldAttachToken(req.url)) {
    nextReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(nextReq).pipe(
    catchError((err) => {
      if (err?.status === 401 && shouldAttachToken(req.url)) {
        localStorage.removeItem('token');
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
