import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const LoginSuccess = () => {
  const navigate = useNavigate();
  const { handleSocialLogin, checkAuth } = useAuth();
  const [loginStatus, setLoginStatus] = useState<
    "processing" | "success" | "error"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleLoginSuccess = useCallback(
    async (userData: any) => {
      try {
        if (!userData.accessToken) {
          throw new Error("액세스 토큰이 없습니다");
        }

        const result = await handleSocialLogin({
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          user: userData.user,
        });

        if (result.success) {
          setLoginStatus("success");

          const redirectUrl = localStorage.getItem("loginRedirectUrl");
          localStorage.removeItem("loginRedirectUrl");

          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            await checkAuth();
            navigate("/");
          }
        } else {
          throw new Error(result.error || "알 수 없는 오류");
        }
      } catch (error: any) {
        setLoginStatus("error");
        setErrorMessage(error.message || "로그인 처리에 실패했습니다.");
      }
    },
    [handleSocialLogin, navigate, checkAuth]
  );

  useEffect(() => {
    const handleUrlParams = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);

        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const userParam = searchParams.get("user");

        if (accessToken) {
          const userData = {
            accessToken,
            refreshToken: refreshToken || "",
            user: userParam ? JSON.parse(decodeURIComponent(userParam)) : null,
          };

          await handleLoginSuccess(userData);
          return;
        }

        throw new Error("URL에서 인증 토큰을 찾을 수 없습니다.");
      } catch (error: any) {
        setLoginStatus("error");
        setErrorMessage(error.message || "로그인 처리에 실패했습니다.");
      }
    };

    handleUrlParams();
  }, [handleLoginSuccess]);

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
        {loginStatus === "error" && (
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            홈으로 이동
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginSuccess;
