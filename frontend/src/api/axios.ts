import axios from 'axios';

// 환경변수가 없을 경우를 대비한 기본값 설정
const API_URL = import.meta.env.BACKEND_URL || 'http://localhost:3000';

// API_URL이 undefined인지 확인
if (!API_URL) {
  console.error('API_URL is not defined');
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// fetch 사용 시에도 API_URL 확인
if (API_URL) {
  fetch(`${API_URL}/api/auth/status`, { credentials: 'include' });
}
