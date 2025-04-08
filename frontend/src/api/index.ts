import axios from "axios";
import { setApiInstance } from "../utils/authUtils";

// 환경변수에서 기본 URL 가져오기
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_URL = `${BASE_URL}/api`;

// API 기본 설정
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: false, // 쿠키 사용 안함
});

// API 인스턴스를 authUtils에 등록
setApiInstance(api);

// 초기 토큰 설정 (앱 시작시)
const token = localStorage.getItem("authToken");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  // 글로벌 axios 헤더에도 설정
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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

// API 호출 전 항상 최신 토큰 확인하는 함수
const ensureToken = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// ===== 인증 관련 API =====
// 로그인 API
export const userLogin = async (email: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { email, password });

    if (response.data.accessToken) {
      localStorage.setItem("authToken", response.data.accessToken);
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.accessToken}`;
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.accessToken}`;
    }

    if (response.data.refreshToken) {
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }

    if (response.data.user?.displayName) {
      localStorage.setItem("userName", response.data.user.displayName);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

// 로그아웃
export const userLogout = () => {
  // authUtils의 removeAuthToken 함수를 직접 import해서 사용
  import("../utils/authUtils")
    .then(({ removeAuthToken }) => {
      removeAuthToken();
    })
    .catch(() => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
      delete axios.defaults.headers.common["Authorization"];
      delete api.defaults.headers.common["Authorization"];
    });
};

// 인증 상태 확인
export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return { authenticated: false };
    }

    // 헤더에 토큰 명시적 추가
    const response = await api.get("/auth/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    return { authenticated: false };
  }
};

// ===== 사용자 관리 API (관리자 전용) =====
// 사용자 목록 조회
export const getUsersList = async () => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.get("/auth/users/list");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    if (error.response?.status === 401) {
      throw new Error("로그인이 필요합니다");
    }
    throw error;
  }
};

// 관리자 권한 토글
export const toggleUserAdminRole = async (userId: string) => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.patch(`/auth/users/admin-toggle/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

// 사용자 삭제
export const deleteUserById = async (userId: string) => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.delete(`/auth/users/delete/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

// ===== 문의 관리 API =====
// 문의 전송
export const submitContactForm = async (
  name: string,
  email: string,
  message: string
) => {
  try {
    const response = await api.post("/contact/submit", {
      name,
      email,
      message,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 문의 목록 조회 (관리자 전용)
export const getContactsList = async () => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.get("/contact/list");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

// 문의 읽음 표시 (관리자 전용)
export const markContactAsRead = async (contactId: string) => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.patch(`/contact/mark-read/${contactId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 문의 삭제 (관리자 전용)
export const deleteContact = async (contactId: string) => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.delete(`/contact/delete/${contactId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===== 대시보드 API =====
// 방문자 통계 조회
export const getVisitorStats = async () => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.get("/stats/visitors");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

// 읽지 않은 문의 수 조회
export const getUnreadContactsCount = async () => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.get("/contact/unread-count");
    return response.data.count;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

// 대시보드 요약 정보 조회 (모든 주요 지표)
export const getDashboardSummary = async () => {
  try {
    ensureToken(); // 토큰 확인
    const response = await api.get("/dashboard/summary");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

export default api;
