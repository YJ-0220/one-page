import axios from "axios";

// 기본 URL을 명시적으로 설정
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// 디버깅을 위해 현재 API_URL 출력
console.log("현재 사용 중인 API URL:", API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
