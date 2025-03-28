import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// fetch 사용 시
fetch(`${API_URL}/api/auth/status`, { credentials: 'include' })
