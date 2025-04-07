import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import AdminPage from "@/pages/Admin";
import Login from "@/pages/Login";
import ContactWidget from "@/components/ContactWidget";
import { setupAxiosInterceptors } from "./utils/authUtils";
import useAuth from "./hooks/useAuth";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginSuccess from "./components/LoginSuccess";

// axios 인터셉터 설정 (앱 시작 시 1회 실행)
setupAxiosInterceptors();

// 페이지 로드 시 토큰 확인 및 설정
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

function App() {
  const [activePage, setActivePage] = useState<string>("home");

  // useAuth 훅 사용
  const { isAuthenticated, user, loading, logout, checkAuth } = useAuth();

  // 사용자 정보 추출
  const username = user?.displayName || null;
  const isAdmin = user?.isAdmin || false;

  // 로그인 핸들러 함수
  const handleLogin = useCallback(
    (_userName: string) => {
      setActivePage("home");
      checkAuth().catch(() => {});
    },
    [checkAuth, setActivePage]
  );

  // URL 쿼리 파라미터 처리 (이제 이 기능은 LoginSuccess 컴포넌트로 이동)
  useEffect(() => {
    // URL에 토큰이 있는 경우에도 처리 (이전 방식과의 호환성)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // 토큰 저장 및 URL 정리
      localStorage.setItem("authToken", token);
      if (params.get("refresh"))
        localStorage.setItem("refreshToken", params.get("refresh") || "");
      if (params.get("user"))
        localStorage.setItem("userName", params.get("user") || "");

      // API 헤더 설정
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // URL 정리 및 인증 상태 확인
      window.history.replaceState({}, document.title, window.location.pathname);
      checkAuth().catch(() => {});
    }
  }, [checkAuth]);

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    setActivePage("home");
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
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-success" element={<LoginSuccess />} />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <AdminPage
                  onLogin={handleLogin}
                  isLoggedIn={isAuthenticated}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </main>
      <ContactWidget />
      <Footer />
    </div>
  );
}

export default App;
