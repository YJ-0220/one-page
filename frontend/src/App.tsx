import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import AdminPage from "@/pages/Admin";
import Login from "@/pages/Login";
import ContactWidget from "@/components/ContactWidget";
import useAuth from "./hooks/useAuth";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import LoginSuccess from "./components/login/LoginSuccess";

// 페이지 로드 시 토큰 확인 및 설정
const token = localStorage.getItem("authToken");
if (token) {
  // 토큰이 있으면 API 요청 시 자동으로 설정됨
}

function App() {
  const [activePage, setActivePage] = useState<string>("home");
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, checkAuth, logout, handleSocialLogin } = useAuth();
  const isAdmin = user?.role === 'admin';

  // 로그인 핸들러 함수
  const handleLogin = useCallback(async () => {
    setActivePage("home");
    try {
      const authStatus = await checkAuth();
      if (!authStatus) {
        window.location.reload();
      }
    } catch (error) {
      console.error("로그인 후 인증 상태 확인 오류:", error);
      window.location.reload();
    }
  }, [checkAuth]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout();
    navigate('/');
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

  // 로컬 스토리지 이벤트 리스너로 소셜 로그인 상태 확인
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "loginSuccess" && event.newValue === "true") {
        try {
          const loginData = JSON.parse(
            localStorage.getItem("loginData") || "{}"
          );

          const result = await handleSocialLogin(loginData);

          if (result.success) {
            setActivePage("home");
            localStorage.removeItem("loginSuccess");
            localStorage.removeItem("loginData");
            navigate("/");
          }
        } catch (error) {
          console.error("App: 인증 상태 업데이트 실패", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        try {
          const loginData = JSON.parse(
            localStorage.getItem("loginData") || "{}"
          );
          
          const result = await handleSocialLogin(loginData);
          
          if (result.success) {
            setActivePage("home");
            localStorage.removeItem("loginSuccess");
            localStorage.removeItem("loginData");
            navigate("/");
          }
        } catch (error) {
          console.error("App: 메시지 이벤트 처리 실패", error);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("message", handleMessage);
    };
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
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            }
          />
          <Route path="/auth/callback" element={<LoginSuccess />} />
        </Routes>
      </main>
      <Footer />
      <ContactWidget />
    </div>
  );
}

export default App;
