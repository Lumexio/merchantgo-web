const API_BASE = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://api.merchantgo.store');

export async function registerAppwriteUser(email, password, name) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || `HTTP ${res.status}: Cloud onboarding failed`);
    }
    return json.data;
  } catch (err) {
    console.error("Server Proxy Registration Error:", err);
    throw err;
  }
}

export async function loginAppwriteUser(email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || `HTTP ${res.status}: Invalid cloud credentials`);
    }
    return json.data;
  } catch (err) {
    console.error("Server Proxy Sign In Error:", err);
    throw err;
  }
}

export async function checkAppwriteSession() {
  return null;
}

export async function logoutAppwriteSession() {
  return true;
}
