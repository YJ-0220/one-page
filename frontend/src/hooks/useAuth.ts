import { useState, useEffect, useCallback } from "react";
import { userLogin, userLogout, checkAuthStatus } from "../api";
import { AuthUser } from "../types/auth";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// API 인스턴스 설정
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: false,
});

// 토큰 관리 함수들
const setAuthToken = (token: string): void => {
  localStorage.setItem("authToken", token);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// 인증 훅
export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 정보를 설정하는 함수
  const setUserData = useCallback((userData: any) => {
    setIsAuthenticated(true);
    setUser({
      _id: userData._id,
      displayName: userData.displayName || userData.email || "사용자",
      email: userData.email,
      photoURL: userData.photo || null,
      role: userData.isAdmin ? "admin" : "user",
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    });
  }, []);

  // 인증 상태 확인
  const checkAuth = useCallback(async () => {
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return false;
      }

      const response = await checkAuthStatus();

      if (response.authenticated && response.user) {
        const transformedUser = {
          ...response.user,
          photoURL: response.user.photo,
          role: response.user.isAdmin === true ? "admin" : "user",
        };
        setUserData(transformedUser);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err) {
      setError("인증 상태 확인 오류");
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUserData]);

  // 소셜 로그인 성공 처리 함수
  const handleSocialLogin = useCallback(
    async (data: any) => {
      setLoading(true);
      setError(null);

      try {
        const { accessToken, refreshToken, user } = data;

        if (!accessToken) {
          throw new Error("액세스 토큰이 없습니다.");
        }

        // 토큰 저장
        localStorage.setItem("authToken", accessToken);
        // axios 전역 설정
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // 사용자 정보 가져오기
        let userData = user;
        if (!userData) {
          try {
            const response = await api.get("/auth/status");
            userData = response.data.user;
          } catch (error) {
            // 사용자 정보를 가져오지 못해도 계속 진행
          }
        }

        if (userData) {
          // 사용자 정보 변환 및 저장
          const transformedUser = {
            _id: userData._id,
            displayName: userData.displayName || userData.email || "사용자",
            email: userData.email,
            photoURL: userData.photo || userData.photoURL || null,
            role: userData.isAdmin === true ? "admin" : "user",
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: userData.updatedAt || new Date().toISOString(),
          };

          // 로컬 스토리지에 사용자 정보 저장
          localStorage.setItem("user", JSON.stringify(transformedUser));
          
          // 상태 업데이트
          setUserData(transformedUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(true);
        }

        return { success: true };
      } catch (err: any) {
        setError(err.message || "소셜 로그인 처리 중 오류가 발생했습니다.");
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [setUserData]
  );

  // 로그인
  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await userLogin(email, password);

        if (response.accessToken && response.user) {
          // 토큰 저장
          localStorage.setItem("authToken", response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem("refreshToken", response.refreshToken);
          }

          // api 헤더에 토큰 설정
          api.defaults.headers.common["Authorization"] = `Bearer ${response.accessToken}`;

          // 사용자 정보 변환 및 저장
          const transformedUser = {
            ...response.user,
            photoURL: response.user.photo,
            role: response.user.isAdmin === true ? "admin" : "user",
          };
          setUserData(transformedUser);
          return response;
        } else {
          throw new Error("로그인 응답 오류");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "로그인 오류");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUserData]
  );

  // 로그아웃
  const logout = async () => {
    try {
      userLogout();
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      window.location.href = "/";
    } catch (error) {
      setError("로그아웃 처리 중 오류가 발생했습니다.");
    }
  };

  // 초기 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    handleSocialLogin,
  };
}
