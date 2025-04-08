import axios from "axios";

// 기본 URL 설정
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false, // 쿠키 사용하지 않으므로 false로 변경
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 토큰 갱신 함수
const refreshTokenFn = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다');
    }

    const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
      refreshToken
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return accessToken;
  } catch (error) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    throw error;
  }
};

// 요청 인터셉터 - 토큰 추가
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
    const originalRequest = error.config;
    
    // 토큰 만료로 401 에러가 발생하고, 재시도하지 않았던 요청인 경우
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        // 토큰 갱신 시도
        const newToken = await refreshTokenFn();
        
        // 헤더 업데이트
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료되었거나 오류가 발생한 경우
        if (!window.location.pathname.includes('/login')) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // 다른 401 에러(인증 실패 등)
    if (error.response?.status === 401 && error.response?.data?.code !== 'TOKEN_EXPIRED') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      if (!window.location.pathname.includes('/login')) {
        alert('인증에 실패했습니다. 다시 로그인해주세요.');
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export { api };