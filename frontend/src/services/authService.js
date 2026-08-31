const API_BASE = 'http://localhost:8000';

export async function loginUser(username, password) {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    let message;
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = (detail[0]?.msg) ? detail[0].msg : 'Invalid login request.';
    } else {
      message = 'Login failed. Please check your credentials.';
    }
    throw new Error(message || 'Login failed. Please check your credentials.');
  }

  const tokenData = await res.json();
  
  localStorage.setItem('shieldmail_access_token', tokenData.access_token);
  localStorage.setItem('shieldmail_refresh_token', tokenData.refresh_token);

  // Fetch and cache user profile
  const user = await getCurrentUser(tokenData.access_token);
  if (user) {
    localStorage.setItem('shieldmail_user', JSON.stringify(user));
  }
  return user;
}

export async function loginWithGoogle(googleData = {}) {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(googleData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Google sign-in failed. Please try again.');
  }

  const tokenData = await res.json();

  localStorage.setItem('shieldmail_access_token', tokenData.access_token);
  localStorage.setItem('shieldmail_refresh_token', tokenData.refresh_token);

  const user = await getCurrentUser(tokenData.access_token);
  if (user) {
    localStorage.setItem('shieldmail_user', JSON.stringify(user));
  }
  return user;
}

export async function signupUser(userData) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed. Please try again.');
  }

  const tokenData = await res.json();

  localStorage.setItem('shieldmail_access_token', tokenData.access_token);
  localStorage.setItem('shieldmail_refresh_token', tokenData.refresh_token);

  const user = await getCurrentUser(tokenData.access_token);
  if (user) {
    localStorage.setItem('shieldmail_user', JSON.stringify(user));
  }
  return user;
}

export async function getCurrentUser(token = null) {
  const accessToken = token || getToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (res.ok) {
      const user = await res.json();
      localStorage.setItem('shieldmail_user', JSON.stringify(user));
      return user;
    }
  } catch (e) {
    console.warn("Failed to fetch user profile:", e);
  }
  return null;
}

export function logoutUser() {
  localStorage.removeItem('shieldmail_access_token');
  localStorage.removeItem('shieldmail_refresh_token');
  localStorage.removeItem('shieldmail_user');
  sessionStorage.removeItem('shieldmail_access_token');
  sessionStorage.removeItem('shieldmail_refresh_token');
  sessionStorage.removeItem('shieldmail_user');
}

export function getStoredUser() {
  try {
    const u = localStorage.getItem('shieldmail_user') || sessionStorage.getItem('shieldmail_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export async function login(username, password) {
  const user = await loginUser(username, password);
  const token = getToken();
  return { access_token: token, user };
}

export function getToken() {
  const t = localStorage.getItem('shieldmail_access_token') || sessionStorage.getItem('shieldmail_access_token');
  if (t && t !== 'false' && t !== 'null' && t !== 'undefined') {
    return t;
  }
  return null;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('shieldmail_access_token', token);
  }
}

export function removeToken() {
  logoutUser();
}
