import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import AdminPage from "@/pages/Admin";
import ContactWidget from "@/components/ContactWidget";
import { checkAuthStatus as apiCheckAuthStatus, userLogout } from './api';

function App() {
  const [activePage, setActivePage] = useState("home");
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasShownExpiredAlert, setHasShownExpiredAlert] = useState(false);

  // 백엔드에서 로그인 상태 확인
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setUsername(null);
        setUserId(null);
        setIsAdmin(false);
        setLoading(false);
        return { authenticated: false };
      }
      
      const response = await apiCheckAuthStatus();
      return response; // 응답 반환
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setUsername(null);
      setUserId(null);
      setIsAdmin(false);
      setLoading(false);
      return { authenticated: false };
    }
  };

  // 로그인 핸들러 함수
  const handleLogin = useCallback((user: string) => {
    console.log("로그인 처리:", user);
    setUsername(user);
    setSessionExpired(false);
    setActivePage('home');
    
    // 백엔드에서 사용자 정보 가져오기
    checkAuthStatus().then(response => {
      if (response?.authenticated) {
        console.log("인증 성공");
      }
    });
  }, []);

  // 소셜 로그인 메시지 리스너
  useEffect(() => {
    console.log("메시지 리스너 등록");
    
    // 메시지 이벤트 핸들러
    const messageHandler = (event: MessageEvent) => {
      console.log("메시지 수신:", event.origin, event.data);
      
      // 타입 확인
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        console.log("로그인 성공 메시지 수신:", event.data);
        
        const { token, refreshToken, user } = event.data;
        
        // 토큰 저장
        localStorage.setItem('authToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userName', user);
        
        // API 헤더 설정 (중요)
        try {
          const api = require('./api').default;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log("API 헤더 설정 완료");
        } catch (error) {
          console.error("API 헤더 설정 실패:", error);
        }
        
        // 로그인 처리
        handleLogin(user);
      }
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('message', messageHandler);
    
    // 정리 함수
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [handleLogin]);

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    const checkLogin = async () => {
      try {
        // 토큰 확인
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // 백엔드 확인
        const response = await apiCheckAuthStatus();
        console.log("로그인 상태:", response);
        
        if (response.authenticated && response.user) {
          setUsername(response.user.displayName || response.user.email);
          setUserId(response.user._id || response.user.userId);
          setIsAdmin(response.user.isAdmin || false);
        }
      } catch (error) {
        console.error("로그인 확인 오류:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkLogin();
  }, []);

  const handleLogout = async () => {
    userLogout();
    setUsername(null);
    setUserId(null);
    setIsAdmin(false);
    setActivePage('home');
  };

  // 세션 만료 알림 표시
  useEffect(() => {
    if (sessionExpired && !hasShownExpiredAlert) {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      setHasShownExpiredAlert(true);
      setSessionExpired(false);
    }
  }, [sessionExpired, hasShownExpiredAlert]);

  // 로딩 중이면 간단한 로딩 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  // 활성화된 페이지에 따라 컨텐츠 렌더링
  const renderContent = () => {
    switch(activePage) {
      case 'home':
        return <Home username={username || "방문자"} />;
      case 'admin':
        return <AdminPage onLogin={handleLogin} isLoggedIn={!!username} />;
      default:
        return <Home username={username || "방문자"} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        activePage={activePage} 
        setActivePage={setActivePage}
        username={username} 
        userId={userId}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex justify-center items-center pt-20">
        <div className="w-full bg-transparent">
          {renderContent()}
        </div>
      </main>

      <Footer />
      
      {/* 문의 위젯 */}
      <ContactWidget />
    </div>
  );
}

export default App;
