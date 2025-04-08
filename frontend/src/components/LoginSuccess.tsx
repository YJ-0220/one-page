import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthToken } from '../utils/authUtils';
import axios from 'axios';

const LoginSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleLoginSuccess = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken) {
          // 토큰 저장
          localStorage.setItem('authToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }

          // API 헤더 설정
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          // 홈으로 리다이렉트
          navigate('/');
        }
      } catch (error) {
        console.error('로그인 처리 중 오류 발생:', error);
        navigate('/login');
      }
    };

    handleLoginSuccess();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">로그인 처리 중...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
};

export default LoginSuccess;
