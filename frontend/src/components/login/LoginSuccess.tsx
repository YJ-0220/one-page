import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../api";
import { getBasePath } from "../../utils/environment";
const LoginSuccess = () => {
  const location = useLocation();
  const { handleSocialLogin } = useAuth();
  const [loginStatus, setLoginStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleLoginSuccess = useCallback(async (userData: any) => {
    try {
      const result = await handleSocialLogin({
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        user: userData.user
      });

      if (result.success) {
        setLoginStatus("success");
        if (window.opener) {
          // 부모 창 새로고침
          window.opener.location.reload();
          // 현재 창 닫기
          window.close();
        } else {
          const basePath = getBasePath();
          window.location.href = basePath;
        }
      }
    } catch (error) {
      console.error("Social login failed:", error);
      setLoginStatus("error");
      setErrorMessage("로그인 처리에 실패했습니다.");
    }
  }, [handleSocialLogin]);

  useEffect(() => {
    const handleUrlParams = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));

        // Google 로그인 처리
        const accessToken = params.get("accessToken") || hashParams.get("accessToken");
        const refreshToken = params.get("refreshToken") || hashParams.get("refreshToken");

        if (accessToken && refreshToken) {
          await handleLoginSuccess({ accessToken, refreshToken, user: null });
          return;
        }

        // LINE 로그인 처리
        const lineAccessToken = params.get("line_access_token") || hashParams.get("line_access_token");
        const lineUserId = params.get("line_user_id") || hashParams.get("line_user_id");

        if (lineAccessToken && lineUserId) {
          const response = await api.post("/auth/line/callback", {
            accessToken: lineAccessToken,
            userId: lineUserId,
          });

          if (response.data.success) {
            await handleLoginSuccess(response.data);
            return;
          }
        }

        setLoginStatus("error");
        setErrorMessage("로그인 처리에 실패했습니다.");
      } catch (error) {
        console.error("URL parameter processing failed:", error);
        setLoginStatus("error");
        setErrorMessage("로그인 처리 중 오류가 발생했습니다.");
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
            onClick={() => window.location.href = getBasePath()}
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
