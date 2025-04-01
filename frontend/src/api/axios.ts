import axios from "axios";

// 기본 URL 설정
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// 요청 인터셉터 추가 - 모든 요청에 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 처리
api.interceptors.response.use(
  response => response,
  async error => {
    // 로그인 만료 또는 권한 없음 오류 시 처리
    if (error.response && error.response.status === 401) {
      // 토큰 만료됨
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // 사용자에게 알림
      alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      
      // 홈페이지로 리다이렉션
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export { api };