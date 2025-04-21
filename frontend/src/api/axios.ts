import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const refreshTokenFn = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("리프레시 토큰이 없습니다");
    }

    const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    return accessToken;
  } catch (error) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    throw error;
  }
};

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

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshTokenFn();

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        if (!window.location.pathname.includes("/login")) {
          alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    if (
      error.response?.status === 401 &&
      error.response?.data?.code !== "TOKEN_EXPIRED"
    ) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");

      if (!window.location.pathname.includes("/login")) {
        alert("인증에 실패했습니다. 다시 로그인해주세요.");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { api };
