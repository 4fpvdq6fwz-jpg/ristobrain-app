export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthState {
  token: string;
  user: AuthUser;
  workspace: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

export function getAuth(): AuthState | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('rb_token');
    const raw = localStorage.getItem('rb_auth');
    if (!token || !raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(data: AuthState): void {
  localStorage.setItem('rb_token', data.token);
  localStorage.setItem('rb_auth', JSON.stringify(data));
}

export function clearAuth(): void {
  localStorage.removeItem('rb_token');
  localStorage.removeItem('rb_auth');
}

export function isAuthenticated(): boolean {
  return !!getAuth();
}
