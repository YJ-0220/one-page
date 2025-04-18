import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import AdminPage from "@/pages/Admin";
import Login from "@/pages/Login";
import ContactWidget from "@/components/ContactWidget";
import useAuth from "./hooks/useAuth";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginSuccess from "./components/login/LoginSuccess";

// 페이지 로드 시 토큰 확인 및 설정
const token = localStorage.getItem("authToken");
if (token) {
  // 토큰이 있으면 API 요청 시 자동으로 설정됨
}

function App() {
  const [activePage, setActivePage] = useState<string>("home");
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading,
    checkAuth,
    logout,
    handleSocialLogin,
  } = useAuth();
  const isAdmin = user?.role === "admin";

  // 로그인 핸들러 함수
  const handleLogin = useCallback(async () => {
    setActivePage("home");
    try {
      const authStatus = await checkAuth();
      if (!authStatus) {
        window.location.reload();
      }
    } catch (error) {
      window.location.reload();
    }
  }, [checkAuth]);

  // 로그인 상태 변화를 감지하여 UI 갱신
  useEffect(() => {
    if (isAuthenticated) {
      setActivePage("home");
      
      // 로그인 후 사용자 정보 표시 강제 갱신
      const userInfo = localStorage.getItem("user");
      if (userInfo && !user) {
        try {
          checkAuth();
        } catch (error) {
          // 인증 상태 확인 오류 처리
        }
      }
    }
  }, [isAuthenticated, user, checkAuth]);

  // 초기 앱 로드 시 인증 상태 확인
  useEffect(() => {
    const checkAuthOnLoad = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("초기 인증 상태 확인 오류:", error);
      }
    };
    
    checkAuthOnLoad();
  }, [checkAuth]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // URL 매개변수에서 토큰 확인
  useEffect(() => {
    const url = window.location.href;
    const hasToken = url.includes("token=") || url.includes("accessToken=");

    if (hasToken) {
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(
          urlObj.hash.replace("#/", "?") || urlObj.search
        );
        const token = params.get("token") || params.get("accessToken");
        const refresh = params.get("refresh") || params.get("refreshToken");
        const user = params.get("user");

        if (token) {
          handleSocialLogin({
            accessToken: token,
            refreshToken: refresh,
            user: user ? JSON.parse(user) : null,
          }).then((result: any) => {
            if (result.success) {
              if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.href
                  .split("?")[0]
                  .split("#")[0];
                window.history.replaceState({}, document.title, cleanUrl);
              }
              navigate("/");
            }
          });
        }
      } catch (err) {
        console.error("URL 파라미터 처리 오류:", err);
      }
    }
  }, [handleSocialLogin, navigate]);

  // 로딩 중이면 로딩 표시
  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        username={user?.displayName || null}
        email={user?.email || null}
        photoURL={user?.photoURL || null}
        onLogin={() => navigate("/login")}
        onLogout={handleLogout}
        activePage={activePage}
        setActivePage={setActivePage}
        isAdmin={isAdmin}
      />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/admin"
            element={
              isAuthenticated && isAdmin ? (
                <AdminPage onLogin={handleLogin} isLoggedIn={isAuthenticated} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/auth/callback" element={<LoginSuccess />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
        </Routes>
      </main>
      <Footer />
      <ContactWidget />
    </div>
  );
}

export default App;
