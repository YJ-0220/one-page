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
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
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
  const navigate = useNavigate();

  // useAuth 훅 사용
  const { isAuthenticated, user, loading, logout, checkAuth } = useAuth();

  // 사용자 정보 추출
  const username = user?.displayName || null;
  const isAdmin = user?.role === "admin" || false;

  // URL 매개변수에서 토큰 확인
  useEffect(() => {
    const url = window.location.href;
    const hasToken = url.includes("token=") || url.includes("accessToken=");

    if (hasToken) {
      try {
        // URL에서 토큰 추출
        const urlObj = new URL(url);
        const params = new URLSearchParams(
          urlObj.hash.replace("#/", "?") || urlObj.search
        );
        const token = params.get("token") || params.get("accessToken");
        const refresh = params.get("refresh") || params.get("refreshToken");
        const user = params.get("user");

        if (token) {
          // 토큰 저장
          localStorage.setItem("authToken", token);
          if (refresh) localStorage.setItem("refreshToken", refresh);
          if (user) localStorage.setItem("userName", user);

          // API 헤더 설정
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // 인증 상태 확인
          checkAuth()
            .then(() => {
              // URL 파라미터 제거
              if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.href
                  .split("?")[0]
                  .split("#")[0];
                window.history.replaceState({}, document.title, cleanUrl);
              }
              // 홈으로 리다이렉트
              navigate("/");
            })
            .catch((err) => {
              console.error("인증 상태 확인 실패:", err);
            });
        }
      } catch (err) {
        console.error("URL 파라미터 처리 오류:", err);
      }
    }
  }, [checkAuth, navigate]);

  // 로컬 스토리지 이벤트 리스너로 소셜 로그인 상태 확인
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "loginSuccess" && event.newValue === "true") {
        try {
          // 로그인 데이터 가져오기
          const loginData = JSON.parse(
            localStorage.getItem("loginData") || "{}"
          );
          const { accessToken, refreshToken, user } = loginData;

          if (accessToken) {
            // 토큰 저장
            localStorage.setItem("authToken", accessToken);
            if (refreshToken)
              localStorage.setItem("refreshToken", refreshToken);

            // 사용자 정보가 있는 경우 저장
            if (user) {
              localStorage.setItem("user", JSON.stringify(user));
            }

            // API 헤더 설정
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;

            // 인증 상태 업데이트
            await checkAuth();
            setActivePage("home");

            // 로그인 상태 초기화
            localStorage.removeItem("loginSuccess");
            localStorage.removeItem("loginData");

            // 홈페이지로 리다이렉트
            navigate("/");
          }
        } catch (error) {
          console.error("App: 인증 상태 업데이트 실패", error);
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAuth, navigate]);

  // 로그인 핸들러 함수
  const handleLogin = useCallback(
    async (_userName: string) => {
      setActivePage("home");
      try {
        // 인증 상태 확인 (더 확실한 처리를 위해 async/await 사용)
        const authStatus = await checkAuth();

        // 인증 상태가 false인 경우 즉시 다시 시도
        if (!authStatus) {
          const retryStatus = await checkAuth();

          // 여전히 실패하면 페이지 새로고침
          if (!retryStatus) {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("로그인 후 인증 상태 확인 오류:", error);
        // 오류 발생 시 페이지 새로고침
        window.location.reload();
      }
    },
    [checkAuth, setActivePage]
  );

  // 로그아웃 핸들러
  const handleLogout = () => {
    // 로그아웃 처리
    logout();

    // 홈 페이지로 이동
    setActivePage("home");
    navigate("/");

    // 페이지 새로고침 (선택적)
    // window.location.reload();
  };

  // 로딩 중이면 로딩 표시
  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="app">
      <Header
        username={user?.displayName || null}
        email={user?.email || null}
        photoURL={user?.photoURL || null}
        onLogin={() => navigate("/login")}
        onLogout={handleLogout}
        activePage={activePage}
        setActivePage={setActivePage}
        isAdmin={isAdmin}
        userId={user?._id || null}
      />
      <main className="main-content pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-success" element={<LoginSuccess />} />
          <Route path="/auth/callback" element={<LoginSuccess />} />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <AdminPage onLogin={handleLogin} isLoggedIn={isAuthenticated} />
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
