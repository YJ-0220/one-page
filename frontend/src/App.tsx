import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import AdminPage from "@/pages/Admin";
import ContactWidget from "@/components/ContactWidget";

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
      const response = await fetch('/api/auth/status', {
        credentials: 'include', // 쿠키 포함
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUsername(data.user.displayName || data.user.email || '사용자');
          setUserId(data.user.userId || null);
          setIsAdmin(data.user.isAdmin || false);
          setSessionExpired(false);
          setHasShownExpiredAlert(false); // 로그인 성공 시 알림 표시 상태 초기화
        } else {
          // 인증되지 않음
          if (username && !hasShownExpiredAlert) {
            // 이전에 로그인한 상태였고 아직 알림을 보여주지 않았다면
            setSessionExpired(true);
          }
          setUsername(null);
          setUserId(null);
          setIsAdmin(false);
        }
      }
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩 및 세션 만료 확인
  useEffect(() => {
    checkAuthStatus();
    
    // 정기적으로 인증 상태 확인 (5분마다)
    const sessionCheckInterval = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000);
    
    // 페이지 포커스 시 인증 상태 확인
    const handleFocus = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(sessionCheckInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); 

  const handleLogin = (user: string) => {
    setUsername(user);
    setSessionExpired(false);
    // 로그인 후 권한 확인을 위해 사용자 정보 다시 조회
    checkAuthStatus();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
      });
      setUsername(null);
      setUserId(null);
      setIsAdmin(false);
      setActivePage('home'); // 홈으로 리다이렉트
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 세션 만료 알림 표시
  useEffect(() => {
    if (sessionExpired && !hasShownExpiredAlert) {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      setHasShownExpiredAlert(true); // 알림을 표시했음을 기록
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
