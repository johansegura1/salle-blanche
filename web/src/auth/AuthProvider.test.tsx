import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../api';
import { fakeApi, makeToken, nestError } from '../test-utils';
import { AuthProvider, TOKEN_KEY, useAuth } from './AuthProvider';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const token = makeToken();

describe('AuthProvider', () => {
  it('démarre déconnecté quand localStorage ne contient pas de token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('se connecte : garde le token, et lit le nom et le rôle dedans, accents compris', async () => {
    fakeApi({ 'POST /auth/login': () => Response.json({ access_token: token }) });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(() => result.current.login('claire', 'secret'));

    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(result.current.user).toMatchObject({ username: 'claire', name: 'Claire Martin', role: 'manager' });
  });

  it('laisse passer l’ApiError d’un mauvais mot de passe, et reste déconnecté', async () => {
    fakeApi({ 'POST /auth/login': () => nestError(401, 'Wrong username or password') });
    const { result } = renderHook(() => useAuth(), { wrapper });

    let error: unknown;
    await act(() => result.current.login('claire', 'faux').catch((e: unknown) => (error = e)));

    expect(error).toBeInstanceOf(ApiError);
    expect(result.current.token).toBeNull();
  });

  it('reste connecté après un rechargement : le token est relu dans localStorage', () => {
    localStorage.setItem(TOKEN_KEY, token);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.username).toBe('claire');
  });

  it('considère un token expiré comme une déconnexion', () => {
    localStorage.setItem(TOKEN_KEY, makeToken({ expiresIn: -60 }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('se déconnecte : oublie le token', () => {
    localStorage.setItem(TOKEN_KEY, token);
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
