const SESSION_KEY = 'merchantgo.session';
export const getSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; } };
export const setSession = (s) => { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); return s; };
export const clearSession = () => sessionStorage.removeItem(SESSION_KEY);
