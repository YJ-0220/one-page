import axios from "axios";

// 환경변수에서 기본 URL 가져오기
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// API 기본 설정
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: false,
});

// ===== 인증 관련 API =====
// 로그인 API
export const userLogin = async (email: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 로그아웃
export const userLogout = () => {
  // 모든 인증 관련 데이터 제거
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
  localStorage.removeItem("loginSuccess");
  localStorage.removeItem("loginData");

  // API 헤더에서 토큰 제거
  delete api.defaults.headers.common["Authorization"];
};

// 인증 상태 확인
export const checkAuthStatus = async () => {
  try {
    const response = await api.get("/auth/status");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 토큰 갱신
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("리프레시 토큰이 없습니다");
    }

    const response = await api.post("/auth/refresh-token", {
      refreshToken,
    });

    const { accessToken } = response.data;
    if (accessToken) {
      localStorage.setItem("authToken", accessToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      return accessToken;
    }
    throw new Error("새 액세스 토큰을 받지 못했습니다");
  } catch (error) {
    throw error;
  }
};

// API 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (!window.location.pathname.includes("/login")) {
          alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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

// ===== 사용자 관리 API (관리자 전용) =====
// 사용자 목록 조회
export const getUsersList = async () => {
  try {
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
    const response = await api.patch(`/contact/mark-read/${contactId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 문의 삭제 (관리자 전용)
export const deleteContact = async (contactId: string) => {
  try {
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
    const response = await api.get("/contact/unread-count");
    return response.data.count;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

// 대시보드 요약 정보 조회
export const getDashboardSummary = async () => {
  try {
    const response = await api.get("/stats/dashboard/summary");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("관리자 권한이 필요합니다");
    }
    throw error;
  }
};

export default api;
