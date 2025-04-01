import { api } from './axios';

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
// 로그인 요청
export const userLogin = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  
  // 토큰 저장
  if (response.data.accessToken) {
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken || '');
  }
  
  return response.data;
};

// 로그아웃
export const userLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  return { success: true };
};

// 인증 상태 확인
export const checkAuthStatus = async () => {
  const response = await api.get('/api/auth/status');
  return response.data;
};

// ===== 사용자 관리 API (관리자 전용) =====
// 사용자 목록 조회
export const getUsersList = async () => {
  const response = await api.get('/api/auth/users/list');
  return response.data;
};

// 관리자 권한 토글
export const toggleUserAdminRole = async (userId: string) => {
  const response = await api.patch(`/api/auth/users/admin-toggle/${userId}`);
  return response.data;
};

// 사용자 삭제
export const deleteUserById = async (userId: string) => {
  const response = await api.delete(`/api/auth/users/delete/${userId}`);
  return response.data;
};

// ===== 문의 관리 API =====
// 문의 전송
export const submitContactForm = async (name: string, email: string, message: string) => {
  const response = await api.post('/api/contact/submit', { name, email, message });
  return response.data;
};

// 문의 목록 조회 (관리자 전용)
export const getContactsList = async () => {
  const response = await api.get('/api/contact/list');
  return response.data;
};

// 문의 읽음 표시 (관리자 전용)
export const markContactAsRead = async (contactId: string) => {
  const response = await api.patch(`/api/contact/mark-read/${contactId}`);
  return response.data;
}; 