import { useCallback } from 'react';

export const useSocialLoginForm = () => {
  // 공통 팝업창 설정 함수
  const openPopup = useCallback((url: string) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      "소셜 로그인",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return false;
    }
    return true;
  }, []);

  // Google 로그인 처리
  const handleGoogleLogin = useCallback(() => {
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) {
      alert("백엔드 URL이 설정되지 않았습니다.");
      return;
    }

    const callbackUrl = `${window.location.origin}${window.location.pathname}#/auth/callback`;
    const url = `${baseUrl}/auth/google?callback_url=${encodeURIComponent(callbackUrl)}`;

    openPopup(url);
  }, [openPopup]);

  // LINE 로그인 처리
  const handleLineLogin = useCallback(() => {
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) {
      alert("백엔드 URL이 설정되지 않았습니다.");
      return;
    }

    // 콜백 URL을 현재 페이지의 auth/callback 경로로 설정
    const callbackUrl = `${window.location.origin}${window.location.pathname}#/auth/callback`;
    const state = Math.random().toString(36).substring(7);
    const url = `${baseUrl}/auth/line?callback_url=${encodeURIComponent(callbackUrl)}&state=${state}`;
    
    console.log('LINE 로그인 시도:', {
      baseUrl,
      callbackUrl,
      state,
      finalUrl: url
    });

    if (openPopup(url)) {
      console.log('LINE 로그인 팝업이 성공적으로 열렸습니다.');
    } else {
      console.error('LINE 로그인 팝업 열기 실패');
    }
  }, [openPopup]);

  return {
    handleGoogleLogin,
    handleLineLogin
  };
}; 