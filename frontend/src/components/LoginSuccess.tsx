import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthToken } from '../utils/authUtils';
import axios from 'axios';

const LoginSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginStatus, setLoginStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleLoginSuccess = async () => {
      try {
        const params = new URLSearchParams(location.search);
        
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const user = params.get('user');

        // LINE 로그인은 다른 파라미터를 사용할 수 있음
        const lineAccessToken = params.get('line_access_token');
        const lineUserId = params.get('line_user_id');
        const lineDisplayName = params.get('line_display_name');
        const linePictureUrl = params.get('line_picture_url');

        // LINE 로그인 파라미터 디버깅
        console.log('LINE 로그인 파라미터:', {
          lineAccessToken,
          lineUserId,
          lineDisplayName,
          linePictureUrl
        });

        // LINE 로그인 처리
        if (lineAccessToken && lineUserId) {
          try {
            // LINE 사용자 정보로 로그인 요청
            const response = await axios.post(
              `${import.meta.env.VITE_API_URL}/auth/line/login`,
              {
                lineAccessToken,
                lineUserId,
                lineDisplayName,
                linePictureUrl
              }
            );

            if (response.data.accessToken) {
              // 토큰 저장
              localStorage.setItem('authToken', response.data.accessToken);
              if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
              }
              
              // 사용자 정보 저장
              if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
              }

              // 로그인 성공 이벤트 발생
              localStorage.setItem('loginSuccess', 'true');
              localStorage.setItem('loginData', JSON.stringify({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                user: response.data.user
              }));

              setLoginStatus('success');
              
              // 창을 닫기 시도
              try {
                window.close();
              } catch (e) {
                console.log('자동으로 창을 닫을 수 없습니다. 수동으로 닫아주세요.');
              }
            }
          } catch (error) {
            console.error('LINE 로그인 처리 중 오류:', error);
            setLoginStatus('error');
            setErrorMessage('라인 로그인 처리 중 오류가 발생했습니다.');
          }
        }
        // 일반 소셜 로그인 처리
        else if (accessToken) {
          // 토큰 저장
          localStorage.setItem('authToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          // API 헤더 설정
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          // 사용자 정보 저장
          if (user) {
            localStorage.setItem('user', user);
          }

          // 로그인 성공 이벤트 발생
          localStorage.setItem('loginSuccess', 'true');
          localStorage.setItem('loginData', JSON.stringify({
            accessToken,
            refreshToken,
            user: user ? JSON.parse(user) : null
          }));

          setLoginStatus('success');
          
          // 창을 닫기 시도
          try {
            window.close();
          } catch (e) {
            console.log('자동으로 창을 닫을 수 없습니다. 수동으로 닫아주세요.');
          }
        } else {
          // 토큰이 없는 경우 로그인 페이지로 리다이렉트
          setLoginStatus('error');
          setErrorMessage('토큰이 없습니다.');
        }
      } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        setLoginStatus('error');
        setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
      }
    };

    handleLoginSuccess();
  }, [location, navigate]);

  const handleCloseWindow = () => {
    try {
      window.close();
    } catch (e) {
      alert('브라우저에서 팝업창을 닫을 수 없습니다. 수동으로 닫아주세요.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        {loginStatus === 'processing' && (
          <>
            <h1 className="text-2xl font-bold mb-4">로그인 처리 중...</h1>
            <p className="mb-4">잠시만 기다려주세요. 자동으로 홈페이지로 이동합니다.</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </>
        )}
        
        {loginStatus === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-green-600">로그인 성공!</h1>
            <p className="mb-4">로그인이 완료되었습니다. 이 창을 닫고 메인 페이지로 돌아가세요.</p>
            <button 
              onClick={handleCloseWindow}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              창 닫기
            </button>
          </>
        )}
        
        {loginStatus === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-600">로그인 실패</h1>
            <p className="mb-4">{errorMessage}</p>
            <button 
              onClick={handleCloseWindow}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              창 닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginSuccess;
