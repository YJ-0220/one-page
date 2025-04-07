import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import AdminPage from "@/pages/Admin";
import ContactWidget from "@/components/ContactWidget";
import { setupAxiosInterceptors } from "./utils/authUtils";
import useAuth from "./hooks/useAuth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// axios 인터셉터 설정 (앱 시작 시 1회 실행)
setupAxiosInterceptors();

// 페이지 로드 시 토큰 확인 및 설정
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

function App() {
  const [activePage, setActivePage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // useAuth 훅 사용
  const { isAuthenticated, user, loading, logout, checkAuth } = useAuth();

  // 사용자 정보 추출
  const username = user?.displayName || null;
  const isAdmin = user?.isAdmin || false;

  // 로그인 핸들러 함수
  const handleLogin = useCallback(
    (userName: string) => {
      setActivePage("home");
      checkAuth().catch(() => {});
    },
    [checkAuth]
  );

  // 소셜 로그인 이벤트 리스너
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      try {
        if (event.data && event.data.type === "LOGIN_SUCCESS") {
          const { token, refreshToken, user } = event.data;
          localStorage.setItem("authToken", token);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("userName", user);

          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          handleLogin(user);
        }
      } catch (error) {}
    };

    const storageHandler = (e: StorageEvent) => {
      if (e.key === "authToken" && e.newValue) {
        const user = localStorage.getItem("userName");
        if (user) {
          handleLogin(user);
        }
      }
    };

    window.addEventListener("message", messageHandler);
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
      window.removeEventListener("storage", storageHandler);
    };
  }, [handleLogin]);

  // URL 파라미터로부터 토큰과 사용자 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const refresh = urlParams.get("refresh");
    const user = urlParams.get("user");

    // URL에서 파라미터 제거
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 직접 URL 파라미터로 토큰 전달받은 경우
    if (token && user) {
      // 토큰 저장
      localStorage.setItem("authToken", token);
      if (refresh) localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("userName", user);

      // API 헤더 설정
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // 로그인 실행
      handleLogin(user);
    }
  }, [handleLogin]);

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    setActivePage("home");
  };

  // 콘텐츠 렌더링
  const renderContent = () => {
    switch (activePage) {
      case "home":
        return <Home username={username || "방문자"} />;
      case "admin":
        return <AdminPage onLogin={handleLogin} isLoggedIn={isAuthenticated} />;
      default:
        return <Home username={username || "방문자"} />;
    }
  };

  // 로딩 중이면 로딩 표시
  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="app">
      <Header
        username={username}
        onLogout={handleLogout}
        activePage={activePage}
        setActivePage={setActivePage}
        isAdmin={isAdmin}
        userId={user?._id || null}
        onLogin={handleLogin}
      />
      <main className="main-content">{renderContent()}</main>
      <ContactWidget />
      <Footer />
    </div>
  );
}

export default App;
