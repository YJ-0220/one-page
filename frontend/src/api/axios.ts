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

// 요청 인터셉터 추가 - 모든 요청에 토큰 디버깅
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Request to:', config.url);
    console.log('Auth token exists:', !!token);
    console.log('Auth header set:', !!config.headers.Authorization);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 토큰 설정 유틸리티 함수
export const setAuthToken = (token: string | null, refreshToken: string | null = null) => {
  if (token) {
    // 로컬 스토리지에 토큰 저장
    localStorage.setItem('authToken', token);
    // axios 인스턴스에 헤더 설정
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 리프레시 토큰이 있으면 저장
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  } else {
    // 토큰 제거
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

// 토큰 갱신 함수
const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다');
    }

    const response = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    setAuthToken(accessToken, newRefreshToken);
    return accessToken;
  } catch (error) {
    setAuthToken(null);
    window.location.href = '/'; // 홈페이지로 리디렉션
    return null;
  }
};

// 응답 인터셉터 설정 - 401 오류 시 토큰 갱신 시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 토큰 만료로 인한 401 오류이고 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // 토큰 갱신 시도
      const newToken = await refreshAuthToken();
      
      if (newToken) {
        // 기존 요청의 헤더에 새 토큰 설정
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// 앱 시작 시 저장된 토큰이 있다면 설정
const token = localStorage.getItem('authToken');
if (token) {
  setAuthToken(token);
}

export { api };