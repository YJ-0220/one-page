import { useState } from "react";
import useSocialLoginForm from "../../hooks/useSocialLoginForm";
import useAuth from "../../hooks/useAuth";

interface LoginFormProps {
  onLogin: (username: string) => void;
  onClose: () => void;
  socialOnly?: boolean;
}

const LoginForm = ({
  onLogin,
  onClose,
  socialOnly = false,
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { handleGoogleLogin } = useSocialLoginForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login(email, password);
      if (response && response.user) {
        onLogin(response.user.displayName || response.user.email || email);
        onClose();
        window.location.href = "/";
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "로그인에 실패했습니다.");
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
              required
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
              required
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

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#4285F4"
              />
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#34A853"
              />
            </svg>
            <span className="ml-2">Google 로그인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
