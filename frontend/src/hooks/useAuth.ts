import { useState, useEffect, useCallback } from 'react';
import { userLogin, userLogout, checkAuthStatus } from '../api';
import { setAuthToken, getAuthToken, removeAuthToken } from '../utils/authUtils';

interface AuthUser {
  _id?: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  photo?: string;
}

// 인증 훅
export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 정보를 설정하는 함수 (중복 제거를 위해)
  const setUserData = useCallback((userData: any) => {
    setIsAuthenticated(true);
    setUser({
      _id: userData._id,
      displayName: userData.displayName || userData.email,
      email: userData.email,
      isAdmin: userData.isAdmin || false,
      photo: userData.photo
    });
  }, []);

  // 인증 초기화
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await checkAuthStatus();
        if (response.authenticated && response.user) {
          setUserData(response.user);
        } else {
          removeAuthToken();
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        setError('인증 상태 확인 오류');
        removeAuthToken();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUserData]);

  // 로그인
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userLogin(email, password);
      
      if (response.accessToken && response.user) {
        setAuthToken(response.accessToken);
        setUserData(response.user);
        return response;
      } else {
        throw new Error('로그인 응답 오류');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인 오류');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUserData]);

  // 로그아웃
  const logout = useCallback(() => {
    userLogout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
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
        // 인증 성공 시 사용자 정보 세팅
        setUserData(response.user);

        // 소셜 로그인 계정인데 관리자 권한이 없는 경우 콘솔에 로그
        if (response.user.provider && !response.user.isAdmin) {
          console.log('소셜 로그인 계정 권한 정보:', {
            id: response.user._id,
            provider: response.user.provider,
            isAdmin: response.user.isAdmin
          });
        }

        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err) {
      setError('인증 상태 확인 오류');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUserData]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    checkAuth
  };
} 