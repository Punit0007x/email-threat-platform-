import { API_BASE_URL } from '../config';

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Login failed');
  }

  const data = await response.json();
  return data;
};

export const setToken = (token) => {
  localStorage.setItem('accessToken', token);
};

export const getToken = () => {
  return localStorage.getItem('accessToken');
};

export const removeToken = () => {
  localStorage.removeItem('accessToken');
};
