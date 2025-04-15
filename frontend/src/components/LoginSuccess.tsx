import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axios from "axios";

const LoginSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSocialLoginSuccess } = useAuth();
  const [loginStatus, setLoginStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // 메시지 이벤트 리스너 등록
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data);
      
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        try {
          const { accessToken, refreshToken, user } = event.data;
          
          if (accessToken) {
            handleSocialLoginSuccess({
              accessToken,
              refreshToken,
              user
            }).then(result => {
              if (result.success) {
                setLoginStatus('success');
                // 창 닫기
                setTimeout(() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    navigate('/');
                  }
                }, 1000);
              } else {
                setLoginStatus('error');
                setErrorMessage(result.error || '로그인 처리 중 오류가 발생했습니다.');
              }
            }).catch(error => {
              console.error('Login success handling error:', error);
              setLoginStatus('error');
              setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
            });
          }
        } catch (error) {
          console.error('Message handling error:', error);
          setLoginStatus('error');
          setErrorMessage('메시지 처리 중 오류가 발생했습니다.');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // URL 파라미터 처리
    const handleUrlParams = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));
        
        const accessToken = params.get('accessToken') || hashParams.get('accessToken');
        const refreshToken = params.get('refreshToken') || hashParams.get('refreshToken');
        
        if (accessToken && refreshToken) {
          // 토큰이 있는 경우 API에서 사용자 정보 가져오기
          try {
            // 토큰 설정
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // 사용자 정보 요청
            const userResponse = await axios.get('/api/auth/me');
            const user = userResponse.data;
            
            // 소셜 로그인 처리
            const success = await handleSocialLoginSuccess({
              accessToken,
              refreshToken,
              user
            });
            
            if (success.success) {
              setLoginStatus('success');
              // 창 닫기
              setTimeout(() => {
                if (window.opener) {
                  window.close();
                } else {
                  navigate('/');
                }
              }, 1000);
              return;
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error);
          }
        }
        
        // LINE 로그인 처리
        const lineAccessToken = params.get('line_access_token') || hashParams.get('line_access_token');
        const lineUserId = params.get('line_user_id') || hashParams.get('line_user_id');
        
        if (lineAccessToken && lineUserId) {
          try {
            const response = await axios.post('/api/auth/line/callback', {
              access_token: lineAccessToken,
              user_id: lineUserId
            });
            
            if (response.data.success) {
              setLoginStatus('success');
              // 창 닫기
              setTimeout(() => {
                if (window.opener) {
                  window.close();
                } else {
                  navigate('/');
                }
              }, 1000);
              return;
            }
          } catch (error) {
            console.error('LINE 로그인 처리 오류:', error);
          }
        }
        
        // 처리할 수 있는 로그인 정보가 없는 경우
        setLoginStatus('error');
        setErrorMessage('로그인 정보가 없거나 유효하지 않습니다.');
      } catch (error) {
        console.error('URL parameter handling error:', error);
        setLoginStatus('error');
        setErrorMessage('URL 파라미터 처리 중 오류가 발생했습니다.');
      }
    };
    
    handleUrlParams();
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [location.search, location.hash, handleSocialLoginSuccess, navigate]);

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {loginStatus === "processing" && "로그인 처리 중..."}
          {loginStatus === "success" && "로그인 성공!"}
          {loginStatus === "error" && "로그인 실패"}
        </h2>
        {errorMessage && (
          <p className="text-red-500 text-center mb-4">{errorMessage}</p>
        )}
        <button
          onClick={handleClose}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          {window.opener ? "창 닫기" : "홈으로 이동"}
        </button>
      </div>
    </div>
  );
};

export default LoginSuccess;
