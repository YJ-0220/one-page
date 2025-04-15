import { useState, useEffect, useCallback } from 'react';
import { userLogin, userLogout, checkAuthStatus } from '../api';
import { setAuthToken, getAuthToken, removeAuthToken } from '../utils/authUtils';
import { AuthUser } from '../types/auth';
import axios from 'axios';

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
      displayName: userData.displayName || userData.email || '사용자',
      email: userData.email,
      photoURL: userData.photo || null,
      role: userData.isAdmin ? 'admin' : 'user',
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
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
        // 백엔드 응답 구조에 맞게 변환
        const transformedUser = {
          ...response.user,
          photoURL: response.user.photo,
          role: response.user.isAdmin ? 'admin' : 'user'
        };
        setUserData(transformedUser);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error('인증 상태 확인 오류:', err);
      setError('인증 상태 확인 오류');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUserData]);

  // 소셜 로그인 성공 처리 함수
  const handleSocialLoginSuccess = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('handleSocialLoginSuccess input:', data);
      
      const { accessToken, refreshToken, user } = data;
      
      if (!accessToken) {
        throw new Error('액세스 토큰이 없습니다.');
      }
      
      // 토큰 저장
      setAuthToken(accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // API 헤더 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // 사용자 정보가 없는 경우 백엔드에서 가져오기
      let userData = user;
      if (!userData) {
        try {
          const response = await axios.get('/api/auth/me');
          userData = response.data;
          console.log('User data from API:', userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          throw new Error('사용자 정보를 가져올 수 없습니다.');
        }
      }
      
      // 사용자 정보 처리
      if (userData) {
        // 백엔드 응답 구조에 맞게 변환
        const transformedUser = {
          _id: userData._id,
          displayName: userData.displayName || userData.email || '사용자',
          email: userData.email,
          photoURL: userData.photo || userData.photoURL || null,
          role: userData.isAdmin ? 'admin' : 'user',
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString()
        };
        
        console.log('Transformed user:', transformedUser);
        
        localStorage.setItem('user', JSON.stringify(transformedUser));
        setUserData(transformedUser);
      }
      
      // 인증 상태 확인
      const isAuthenticated = await checkAuth();
      
      if (!isAuthenticated) {
        throw new Error('인증 상태 확인 실패');
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('소셜 로그인 처리 오류:', err);
      setError(err.message || '소셜 로그인 처리 오류');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setUserData, checkAuth]);

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
          // 백엔드 응답 구조에 맞게 변환
          const transformedUser = {
            ...response.user,
            photoURL: response.user.photo,
            role: response.user.isAdmin ? 'admin' : 'user'
          };
          setUserData(transformedUser);
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
        // 백엔드 응답 구조에 맞게 변환
        const transformedUser = {
          ...response.user,
          photoURL: response.user.photo,
          role: response.user.isAdmin ? 'admin' : 'user'
        };
        setUserData(transformedUser);
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
  const logout = async () => {
    try {
      // 로컬 스토리지의 모든 인증 관련 데이터 제거
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('loginSuccess');
      localStorage.removeItem('loginData');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');

      // axios 기본 헤더에서 Authorization 제거
      delete axios.defaults.headers.common['Authorization'];

      // 상태 초기화
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    handleSocialLoginSuccess
  };
} 