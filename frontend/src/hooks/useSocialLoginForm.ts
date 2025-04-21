import { useCallback } from "react";

// 환경변수
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface UseSocialLoginFormProps {
  path?: string;
}

/**
 * 소셜 로그인 폼 훅
 */
const useSocialLoginForm = ({ path = "/" }: UseSocialLoginFormProps = {}) => {
  // 현재 URL 저장 (로그인 후 리다이렉트용)
  const saveCurrentPath = () => {
    localStorage.setItem("loginRedirectUrl", path);
  };

  // 구글 로그인 핸들러
  const handleGoogleLogin = useCallback(() => {
    saveCurrentPath();
    // 콜백 URL: 로그인 성공 후 리다이렉트될 경로
    const callbackUrl = `${window.location.origin}/auth/callback`;
    
    // 구글 인증 URL
    const googleUrl = `${API_URL}/auth/google?callback_url=${encodeURIComponent(callbackUrl)}`;
    
    // 구글 로그인 페이지로 리다이렉트
    window.location.href = googleUrl;
  }, [path]);

  return {
    handleGoogleLogin,
  };
};

export default useSocialLoginForm;
