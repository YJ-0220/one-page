import { useEffect } from "react";
import axios from "axios";

interface UseSocialLoginProps {
  onLoginSuccess: (user: any) => void;
  checkAuth: () => Promise<boolean>;
}

export const useSocialLogin = ({
  onLoginSuccess,
  checkAuth,
}: UseSocialLoginProps) => {
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
            console.log("소셜 로그인 성공");
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
            console.log("인증 상태 업데이트 성공");

            // 로그인 상태 초기화
            localStorage.removeItem("loginSuccess");
            localStorage.removeItem("loginData");

            // 로그인 성공 콜백 호출
            onLoginSuccess(user);
          }
        } catch (error) {
          console.error("인증 상태 업데이트 실패", error);
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAuth, onLoginSuccess]);
};
