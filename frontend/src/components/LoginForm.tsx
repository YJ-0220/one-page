import { useState, useEffect } from "react";
import axios from "axios";
import { userLogin } from "../api";
import { useSocialLoginForm } from "../hooks/useSocialLoginForm";

interface LoginFormProps {
  onLogin: (username: string) => void;
  onClose: () => void;
  socialOnly?: boolean;
  modalMode?: boolean;
  onSocialLoginClick?: () => void;
}

const LoginForm = ({
  onLogin,
  onClose,
  socialOnly = false,
  modalMode = false,
  onSocialLoginClick
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 소셜 로그인 핸들러 가져오기
  const { handleGoogleLogin, handleLineLogin } = useSocialLoginForm();

  // 로컬 스토리지 이벤트 리스너로 소셜 로그인 상태 확인
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'loginSuccess' && event.newValue === 'true') {
        try {
          // 로그인 데이터 가져오기
          const loginData = JSON.parse(localStorage.getItem('loginData') || '{}');
          const { accessToken, refreshToken, user } = loginData;

          if (accessToken && user) {
            console.log('로그인 성공 데이터:', { accessToken, refreshToken, user });
            
            // 토큰 저장
            localStorage.setItem("authToken", accessToken);
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
            
            // 사용자 정보 저장
            localStorage.setItem("user", JSON.stringify(user));

            // API 헤더 설정
            axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

            // 로그인 콜백 호출
            onLogin(user.displayName);
            onClose();
            
            // 홈페이지로 리다이렉트
            window.location.href = '/';
          }
        } catch (error) {
          console.error('로그인 처리 중 오류:', error);
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [onLogin, onClose]);

  // 이메일/비밀번호 로그인
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await userLogin(email, password);

      // 로그인 성공
      const userName = response.user?.displayName || response.user?.email || email;

      // 로그인 성공 데이터 저장
      localStorage.setItem('loginSuccess', 'true');
      localStorage.setItem('loginData', JSON.stringify({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user
      }));

      // 로그인 성공 후 콜백 호출
      onLogin(userName);
      onClose();
      
      // 홈페이지로 리다이렉트
      window.location.href = '/';
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!socialOnly && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이메일 입력"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호 입력"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>
      )}

      {/* 소셜 로그인 섹션 */}
      <div className={socialOnly ? "" : "mt-6"}>
        {!socialOnly && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                소셜 계정으로 로그인
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">
              {/* Google 아이콘 */}
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#4285F4"
              />
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#34A853"
              />
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#FBBC05"
              />
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#EA4335"
              />
            </svg>
            <span className="ml-2">Google</span>
          </button>

          <button
            onClick={handleLineLogin}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* LINE 아이콘 */}
              <path
                d="M22 10.6c0-4.1-4.1-7.4-9.2-7.4s-9.2 3.3-9.2 7.4c0 3.7 3.2 6.7 7.6 7.3.3.1.7.2.8.5.1.3 0 .7-.1 1 0 0-.2.8 0 1 .1.2.7-.4.7-.4l2.9-1.7c.5-.3 1.1-.5 1.6-.5 2.9 0 6.9-2.3 6.9-7.2z"
                fill="#06C755"
              />
            </svg>
            <span className="ml-2">LINE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
