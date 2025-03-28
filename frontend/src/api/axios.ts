import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// fetch 사용 시
fetch(`${API_URL}/api/auth/status`, { credentials: 'include' })
