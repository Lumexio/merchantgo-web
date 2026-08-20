import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';
import {
  setSession,
  getSession,
  clearSession,
  getSelectedTenant,
  setSelectedTenant,
} from '../src/store/auth.js';

describe('MerchantGo Web Client Smoke & Auth Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders login route entry point without crashing', () => {
    let html = '';
    expect(() => {
      html = renderToString(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      );
    }).not.toThrow();

    expect(html).toContain('MERCHANT');
    expect(html).toContain('Admin Portal');
  });

  it('manages multi-tenant session state and tenant selection in auth store', () => {
    expect(getSession()).toBeNull();

    const mockSession = {
      id: 'usr-1',
      email: 'owner@merchantgo.store',
      role: 'OWNER',
      plan: 'PRO',
      token: 'jwt-token-123',
      tenant_id: 't-1',
      tenants: [
        { id: 't-1', tenant_id: 't-1', name: 'Downtown Branch', branch_id: 'b-1' },
        { id: 't-2', tenant_id: 't-2', name: 'Uptown Branch', branch_id: 'b-2' },
      ],
    };

    const saved = setSession(mockSession);
    expect(saved).not.toBeNull();
    expect(getSession()?.email).toBe('owner@merchantgo.store');

    // Default tenant selection via tenant_id
    const defaultTenant = getSelectedTenant();
    expect(defaultTenant?.tenant_id).toBe('t-1');
    expect(defaultTenant?.name).toBe('Downtown Branch');

    // Change selected tenant
    setSelectedTenant('t-2');
    const selected = getSelectedTenant();
    expect(selected?.tenant_id).toBe('t-2');
    expect(selected?.name).toBe('Uptown Branch');

    // Clear session
    clearSession();
    expect(getSession()).toBeNull();
  });
});
