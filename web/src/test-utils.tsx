import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import App from './App';
import { AuthProvider, TOKEN_KEY } from './auth/AuthProvider';
import type { Role } from './types';

/**
 * Les outils des tests. Pas de navigateur ni d'API pendant les tests :
 * l'adresse vit dans un MemoryRouter, et `fetch` est remplacé par une fausse API.
 */

/**
 * The whole app, as main.tsx mounts it, at `route`. With a token, the user
 * is already logged in, as after a reload. A failed request is not retried:
 * the error shows at once.
 */
export function renderApp(route = '/', { token }: { token?: string } = {}) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** One component alone, with a router around it for its <Link>. */
export function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

/**
 * Un token comme ceux de l'API : un vrai en-tête et un vrai payload en
 * base64url, valable une heure. La signature est fausse : le front ne la
 * vérifie jamais, seule l'API le peut.
 */
export function makeToken({
  username = 'claire',
  name = 'Claire Martin',
  role = 'manager',
  sub = `user-${username}`,
  expiresIn = 3600,
}: { username?: string; name?: string; role?: Role; sub?: string; expiresIn?: number } = {}): string {
  const encode = (value: object) => {
    // UTF-8 d'abord, pour les accents des noms, puis base64url.
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub, username, name, role, iat: now, exp: now + expiresIn });
  return `${header}.${payload}.fake-signature`;
}

/** Les deux profils des tests. */
export const managerToken = () => makeToken();
export const userToken = () => makeToken({ username: 'lea', name: 'Léa Dubois', role: 'user' });

/** What the fake API answers to one request. */
type Handler = (request: Request) => Response | Promise<Response>;

/**
 * Replaces `fetch` by a fake API. `routes` maps a method and a path to an
 * answer: `{ 'GET /equipments': () => Response.json([...]) }`. The query string
 * counts when the route has one. Any other request: 404.
 *
 * Returns the list of the requests made, to check what the app sent.
 */
export function fakeApi(routes: Record<string, Handler>): Request[] {
  const requests: Request[] = [];

  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    requests.push(request.clone());
    const { pathname, search } = new URL(request.url);
    const handler = routes[`${request.method} ${pathname}${search}`] ?? routes[`${request.method} ${pathname}`];
    if (!handler) {
      return Response.json({ statusCode: 404, message: `No fake for ${request.method} ${pathname}` }, { status: 404 });
    }
    return handler(request);
  };

  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  return requests;
}

/** An error the way NestJS sends them. */
export function nestError(status: number, message: string | string[]): Response {
  return Response.json({ statusCode: status, message }, { status });
}

/** Le chemin et la query d'une requête, sans l'hôte : "/equipments?zone=FABRICATION". */
export function pathOf(request: Request): string {
  const { pathname, search } = new URL(request.url);
  return pathname + search;
}
