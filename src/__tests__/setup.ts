import '@testing-library/jest-dom/vitest';

Object.defineProperty(globalThis, 'performance', {
  value: {
    now: () => Date.now(),
  },
  writable: true,
});

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

const sessionStore: Record<string, string> = {};
const sessionStorageMock = {
  getItem: (key: string) => sessionStore[key] ?? null,
  setItem: (key: string, value: string) => { sessionStore[key] = value; },
  removeItem: (key: string) => { delete sessionStore[key]; },
  clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); },
  get length() { return Object.keys(sessionStore).length; },
  key: (i: number) => Object.keys(sessionStore)[i] ?? null,
};

Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock, writable: true });
