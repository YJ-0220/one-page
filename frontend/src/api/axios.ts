import axios from "axios";

// 기본 URL을 명시적으로 설정
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// 디버깅을 위해 현재 API_URL 출력
console.log("현재 사용 중인 API URL:", API_URL);

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// 토큰 설정 유틸리티 함수
export const setAuthToken = (token: string | null) => {
  if (token) {
    // 로컬 스토리지에 토큰 저장
    localStorage.setItem('authToken', token);
    // axios 인스턴스에 헤더 설정
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // 토큰 제거
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

// 앱 시작 시 저장된 토큰이 있다면 설정
const token = localStorage.getItem('authToken');
if (token) {
  setAuthToken(token);
}

export { api };
