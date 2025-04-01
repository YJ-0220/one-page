import axios from "axios";

// 기본 URL을 명시적으로 설정
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// API_URL이 undefined인지 확인
if (!API_URL) {
  console.error("API_URL is not defined");
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// fetch 사용 시에도 API_URL 확인
if (API_URL) {
  fetch(`${API_URL}/api/auth/status`, { credentials: "include" });
}
