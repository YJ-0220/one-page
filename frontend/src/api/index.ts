import axios from "axios";

// 환경변수에서 기본 URL 가져오기
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_URL = `${BASE_URL}/api`;

// API 기본 설정
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: false, // 쿠키 사용 안함
});

// 초기 토큰 설정 (앱 시작시)
const token = localStorage.getItem("authToken");
if (token) {
  console.log("초기 API 헤더에 토큰 설정");
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
} else {
  console.log("초기 토큰 없음");
}

// 타입 정의
export interface User {
  _id: string;
  displayName: string;
  email: string;
  photo?: string;
  isAdmin: boolean;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// ===== 인증 관련 API =====
// 로그인 API
export const userLogin = async (email: string, password: string) => {
  try {
    console.log("로그인 요청:", email);
    const response = await api.post("/auth/login", { email, password });
    console.log("로그인 응답:", response.data);
    
    // 토큰 저장
    localStorage.setItem("authToken", response.data.accessToken);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    if (response.data.user?.displayName) {
      localStorage.setItem("userName", response.data.user.displayName);
    }
    
    // API 헤더 설정
    api.defaults.headers.common["Authorization"] = `Bearer ${response.data.accessToken}`;
    
    return response.data;
  } catch (error) {
    console.error("로그인 오류:", error);
    throw error;
  }
};

// 로그아웃
export const userLogout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userName");
  
  // API 헤더에서 토큰 제거
  delete api.defaults.headers.common["Authorization"];
  
  console.log("로그아웃 처리 완료");
};

// 인증 상태 확인
export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("토큰 없음, 인증 확인 중단");
      return { authenticated: false };
    }
    
    console.log("인증 상태 확인 요청");
    const response = await api.get("/auth/status");
    console.log("인증 상태 확인 응답:", response.data);
    return response.data;
  } catch (error) {
    console.error("인증 상태 확인 오류:", error);
    throw error;
  }
};

// ===== 사용자 관리 API (관리자 전용) =====
// 사용자 목록 조회
export const getUsersList = async () => {
  const response = await api.get('/auth/users/list');
  return response.data;
};

// 관리자 권한 토글
export const toggleUserAdminRole = async (userId: string) => {
  const response = await api.patch(`/auth/users/admin-toggle/${userId}`);
  return response.data;
};

// 사용자 삭제
export const deleteUserById = async (userId: string) => {
  const response = await api.delete(`/auth/users/delete/${userId}`);
  return response.data;
};

// ===== 문의 관리 API =====
// 문의 전송
export const submitContactForm = async (name: string, email: string, message: string) => {
  const response = await api.post('/contact/submit', { name, email, message });
  return response.data;
};

// 문의 목록 조회 (관리자 전용)
export const getContactsList = async () => {
  const response = await api.get('/contact/list');
  return response.data;
};

// 문의 읽음 표시 (관리자 전용)
export const markContactAsRead = async (contactId: string) => {
  const response = await api.patch(`/contact/mark-read/${contactId}`);
  return response.data;
};

// 문의 삭제 (관리자 전용)
export const deleteContact = async (contactId: string) => {
  const response = await api.delete(`/contact/delete/${contactId}`);
  return response.data;
};

export default api; 