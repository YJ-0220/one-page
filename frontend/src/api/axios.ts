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

// 요청 인터셉터 추가
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

// 토큰 설정 함수
export const setAuthToken = (token: string | null, refreshToken: string | null = null) => {
  if (token) {
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  } else {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

// 토큰 갱신 함수
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAuthToken = async () => {
  try {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }
    
    isRefreshing = true;
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('리프레시 토큰 없음');

    const response = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    setAuthToken(accessToken, newRefreshToken);
    processQueue(null, accessToken);
    return accessToken;
  } catch (error) {
    setAuthToken(null);
    processQueue(error, null);
    
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background-color: #f44336; color: white; padding: 15px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 5px rgba(0,0,0,0.3);';
    errorMessage.innerText = '세션이 만료되었습니다. 다시 로그인해주세요.';
    document.body.appendChild(errorMessage);
    
    setTimeout(() => {
      if (errorMessage.parentNode) document.body.removeChild(errorMessage);
      window.location.href = '/';
    }, 3000);
    
    return null;
  } finally {
    isRefreshing = false;
  }
};

// 응답 인터셉터
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAuthToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
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