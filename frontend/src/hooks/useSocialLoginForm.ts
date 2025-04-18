import { useCallback } from "react";

export const useSocialLoginForm = () => {
  // 리다이렉트 방식으로 변경
  const redirectToLogin = useCallback((url: string) => {
    // 현재 URL을 로컬 스토리지에 저장 (로그인 후 돌아오기 위해)
    localStorage.setItem("loginRedirectUrl", window.location.href);
    
    // 소셜 로그인 페이지로 리다이렉트
    window.location.href = url;
  }, []);

  // Google 로그인 처리
  const handleGoogleLogin = useCallback(() => {
    const baseUrl = import.meta.env.VITE_API_URL;
    const clientUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin;

    if (!baseUrl) {
      alert("백엔드 URL이 설정되지 않았습니다.");
      return;
    }

    // 콜백 URL - 전체 URL 경로 사용 (해시 없이)
    const callbackUrl = `${clientUrl}/#/auth/callback`;
    
    // 백엔드에 콜백 URL 전달
    const googleAuthUrl = `${baseUrl}/auth/google?callback_url=${encodeURIComponent(callbackUrl)}`;
    
    redirectToLogin(googleAuthUrl);
  }, [redirectToLogin]);

  // LINE 로그인 처리
  const handleLineLogin = useCallback(() => {
    const baseUrl = import.meta.env.VITE_API_URL;
    const clientUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin;

    if (!baseUrl) {
      alert("백엔드 URL이 설정되지 않았습니다.");
      return;
    }

    // 콜백 URL - 전체 URL 경로 사용 (해시 없이)
    const callbackUrl = `${clientUrl}/#/auth/callback`;
    
    // 백엔드에 콜백 URL 전달 (구글 로그인과 동일한 방식으로)
    const lineAuthUrl = `${baseUrl}/auth/line?callback_url=${encodeURIComponent(callbackUrl)}`;
    
    redirectToLogin(lineAuthUrl);
  }, [redirectToLogin]);

  return {
    handleGoogleLogin,
    handleLineLogin,
  };
};
