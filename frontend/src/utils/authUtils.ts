import axios from 'axios';
import { API_URL } from '../api';

// api 인스턴스를 저장할 전역 변수
let apiInstance: any = null;

// API 인스턴스 설정 함수
export const setApiInstance = (api: any): void => {
  apiInstance = api;
};

// 토큰 관리 함수들
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  if (apiInstance?.defaults) {
    apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = (): void => {
  // 로컬 스토리지에서 모든 인증 관련 항목 제거
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  
  // 전역 axios 헤더에서 Authorization 제거
  delete axios.defaults.headers.common['Authorization'];
  
  // api 인스턴스의 헤더도 제거 시도
  if (apiInstance?.defaults) {
    delete apiInstance.defaults.headers.common['Authorization'];
  }
};

// 인증 상태 확인 함수
export const checkAuthenticated = async (): Promise<boolean> => {
  const token = getAuthToken();
  
  if (!token) {
    return false;
  }
  
  try {
    const response = await axios.get(`${API_URL}/api/auth/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.authenticated === true;
  } catch (error) {
    return false;
  }
};

// 토큰 디코딩 함수 (JWT 페이로드 확인용)
export const decodeToken = (token: string): any => {
  try {
    // JWT는 header.payload.signature 형식
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// axios 인터셉터 설정
export const setupAxiosInterceptors = (): void => {
  // 요청 인터셉터
  axios.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // 응답 인터셉터
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // 토큰 만료로 401 에러가 발생한 경우
      if (error.response?.status === 401 && 
          error.response?.data?.code === 'TOKEN_EXPIRED' && 
          !originalRequest._retry) {
        
        originalRequest._retry = true;
        
        try {
          // 리프레시 토큰으로 새 액세스 토큰 요청
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('리프레시 토큰이 없습니다');
          }
          
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { accessToken } = response.data;
          setAuthToken(accessToken);
          
          // 실패했던 요청 재시도
          return axios(originalRequest);
        } catch (refreshError) {
          // 로그아웃 처리
          removeAuthToken();
          if (!window.location.pathname.includes('/login')) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/';
          }
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
}; 