import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  
  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const user = searchParams.get('user');
    
    if (token) {
      // 토큰 저장
      localStorage.setItem('authToken', token);
      if (refresh) localStorage.setItem('refreshToken', refresh);
      if (user) localStorage.setItem('userName', user);
      
      // API 헤더 설정
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      // 1.5초 후 홈으로 이동
      const timer = setTimeout(() => {
        setShowModal(false);
        navigate('/');
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      navigate('/');
    }
  }, [navigate, searchParams]);
  
  return (
    <>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm">
            <h2 className="text-xl font-bold text-green-600 mb-4">로그인 성공!</h2>
            <p className="mb-4">환영합니다. 메인 페이지로 이동합니다.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginSuccess;
