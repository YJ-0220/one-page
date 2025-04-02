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
      if (response?.authenticated && response.user) {
        console.log("인증 성공, 사용자 정보:", response.user);
        // 백엔드에서 받은 사용자 정보로 상태 업데이트
        setUserId(response.user._id || response.user.userId || null);
        setIsAdmin(response.user.isAdmin || false);
        console.log("관리자 권한 설정:", response.user.isAdmin);
      } else {
        console.log("사용자 정보 없음, 기본값 사용");
        setUserId(null);
        setIsAdmin(false);
      }
    });
  }, []);

  // 소셜 로그인 이벤트 리스너
  useEffect(() => {
    console.log("소셜 로그인 이벤트 리스너 등록");
    
    // postMessage 이벤트 핸들러
    const messageHandler = (event: MessageEvent) => {
      console.log("메시지 수신:", event.origin, event.data);
      
      try {
        // 타입 확인
        if (event.data && event.data.type === 'LOGIN_SUCCESS') {
          console.log("로그인 성공 메시지 수신:", event.data);
          
          const { token, refreshToken, user } = event.data;
          
          // 토큰 저장
          console.log("토큰 저장 시작");
          localStorage.setItem('authToken', token);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('userName', user);
          console.log("토큰 저장 완료");
          
          // API 헤더 설정 (중요)
          try {
            // 글로벌 axios 설정
            console.log("axios 헤더 설정 시작");
            const axios = require('axios').default;
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // API 모듈 헤더도 설정
            const api = require('./api').default;
            if (api && api.defaults) {
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              console.log("API 헤더 설정 완료");
            } else {
              console.warn("API 모듈을 가져올 수 없음");
            }
          } catch (error) {
            console.error("API 헤더 설정 실패:", error);
          }
          
          // 로그인 처리
          console.log("handleLogin 호출 준비");
          handleLogin(user);
          console.log("handleLogin 호출 완료");
        }
      } catch (error) {
        console.error("메시지 처리 중 오류:", error);
      }
    };
    
    // 커스텀 이벤트 핸들러
    const socialLoginHandler = (event: any) => {
      console.log("소셜 로그인 성공 이벤트 수신:", event.detail);
      if (event.detail && event.detail.user) {
        console.log("커스텀 이벤트: 사용자 정보 감지", event.detail.user);
        handleLogin(event.detail.user);
      }
    };
    
    // localStorage 변경 이벤트 리스너 (추가 안전장치)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'authToken' && e.newValue) {
        console.log("localStorage 이벤트: 토큰 감지");
        const user = localStorage.getItem('userName');
        if (user) {
          console.log("localStorage에서 사용자 발견:", user);
          handleLogin(user);
        }
      }
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('message', messageHandler);
    window.addEventListener('storage', storageHandler);
    window.addEventListener('socialLoginSuccess', socialLoginHandler as EventListener);
    
    // 이미 토큰이 있는지 확인 (페이지 새로고침 시)
    const existingToken = localStorage.getItem('authToken');
    const existingUser = localStorage.getItem('userName');
    if (existingToken && existingUser && !username) {
      console.log("기존 토큰 발견, 로그인 상태 복원");
      handleLogin(existingUser);
    }
    
    // 정리 함수
    return () => {
      window.removeEventListener('message', messageHandler);
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('socialLoginSuccess', socialLoginHandler as EventListener);
    };
  }, [handleLogin, username]);

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
        
        if (response && response.authenticated && response.user) {
          setUsername(response.user.displayName || response.user.email);
          setUserId(response.user._id || response.user.userId);
          setIsAdmin(response.user.isAdmin || false);
          console.log("관리자 권한:", response.user.isAdmin);
        } else {
          console.log("인증 실패 또는 사용자 정보 없음");
        }
      } catch (error) {
        console.error("로그인 확인 오류:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkLogin();
  }, []);

  // URL 파라미터로부터 토큰과 사용자 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');
    const token = urlParams.get('token');
    const refresh = urlParams.get('refresh');
    const user = urlParams.get('user');
    
    // URL에서 파라미터 제거
    if (loginSuccess || token) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // 로그인 성공 파라미터가 있으면 새로고침하지 않고 상태 업데이트
    if (loginSuccess === 'success') {
      console.log("URL: 로그인 성공 파라미터 감지");
      
      // 로그인 상태 즉시 확인
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userName');
      
      if (storedToken && storedUser) {
        console.log("로그인 성공: 저장된 토큰과 사용자 정보로 로그인");
        
        // 로그인 실행 (상태 업데이트)
        handleLogin(storedUser);
      }
    }
    // 직접 URL 파라미터로 토큰 전달받은 경우
    else if (token && user) {
      console.log("URL: 토큰 파라미터 감지");
      
      // 토큰 저장
      localStorage.setItem('authToken', token);
      if (refresh) localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userName', user);
      
      // API 헤더 설정
      try {
        const axios = require('axios').default;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const api = require('./api').default;
        if (api && api.defaults) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("헤더 설정 오류:", error);
      }
      
      // 로그인 실행
      handleLogin(user);
    }
  }, [handleLogin]);

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
