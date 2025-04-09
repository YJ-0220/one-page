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
        
        // 디버깅을 위한 콘솔 로그 추가
        console.log('로그인 콜백 파라미터:', Object.fromEntries(params.entries()));
        
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
          // LINE 로그인 처리
          localStorage.setItem('authToken', lineAccessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${lineAccessToken}`;
          
          // LINE 사용자 정보 저장
          const lineUser = {
            _id: lineUserId,
            email: `${lineUserId}@line.me`,
            displayName: lineDisplayName || 'LINE 사용자',
            photoURL: linePictureUrl || null,
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(lineUser));
          
          // LINE 사용자 정보 디버깅
          console.log('LINE 사용자 정보:', lineUser);
          
          // 부모 창에 로그인 성공 메시지 전송
          if (window.opener && !window.opener.closed) {
            const messageData = {
              type: 'LOGIN_SUCCESS',
              accessToken: lineAccessToken,
              refreshToken: null,
              user: lineUser
            };
            
            // 메시지 데이터 디버깅
            console.log('부모 창에 전송할 메시지:', messageData);
            
            window.opener.postMessage(messageData, '*');
            
            // 메시지가 전달될 시간을 주기 위해 약간의 지연 추가
            setTimeout(() => {
              try {
                // 여러 방법으로 팝업창 닫기 시도
                window.close();
                window.open('', '_self')?.close();
                window.open('about:blank', '_self')?.close();
              } catch (e) {
                console.error('팝업창 닫기 실패:', e);
              }
            }, 1000);
          } else {
            // 부모 창이 없는 경우 바로 닫기
            try {
              window.close();
              window.open('', '_self')?.close();
              window.open('about:blank', '_self')?.close();
            } catch (e) {
              console.error('팝업창 닫기 실패:', e);
            }
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

          // 부모 창에 로그인 성공 메시지 전송
          if (window.opener && !window.opener.closed) {
            const messageData = {
              type: 'LOGIN_SUCCESS',
              accessToken,
              refreshToken,
              user: user ? JSON.parse(user) : JSON.parse(localStorage.getItem('user') || '{}')
            };
            
            // 메시지 데이터 디버깅
            console.log('부모 창에 전송할 메시지:', messageData);
            
            window.opener.postMessage(messageData, '*');
            
            // 메시지가 전달될 시간을 주기 위해 약간의 지연 추가
            setTimeout(() => {
              try {
                // 여러 방법으로 팝업창 닫기 시도
                window.close();
                window.open('', '_self')?.close();
                window.open('about:blank', '_self')?.close();
              } catch (e) {
                console.error('팝업창 닫기 실패:', e);
              }
            }, 1000);
          } else {
            // 부모 창이 없는 경우 바로 닫기
            try {
              window.close();
              window.open('', '_self')?.close();
              window.open('about:blank', '_self')?.close();
            } catch (e) {
              console.error('팝업창 닫기 실패:', e);
            }
          }
        } else {
          console.error('액세스 토큰이 없습니다.');
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
