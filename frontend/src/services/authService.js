const API_BASE = 'http://localhost:8000';

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed. Please check your credentials.');
  }

  const tokenData = await res.json();
  localStorage.setItem('shieldmail_access_token', tokenData.access_token);
  localStorage.setItem('shieldmail_refresh_token', tokenData.refresh_token);
  
  // Fetch user profile
  const user = await getCurrentUser(tokenData.access_token);
  localStorage.setItem('shieldmail_user', JSON.stringify(user));
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
  localStorage.setItem('shieldmail_user', JSON.stringify(user));
  return user;
}

export async function getCurrentUser(token = null) {
  const accessToken = token || localStorage.getItem('shieldmail_access_token');
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
}

export function getStoredUser() {
  try {
    const u = localStorage.getItem('shieldmail_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}
