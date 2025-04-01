import { useState } from "react";
import axios from "axios";

interface LoginFormProps {
  onLogin: (username: string) => void;
  onClose: () => void;
}

const LoginForm = ({ onLogin, onClose }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 로컬 로그인 API 호출
      const response = await axios.post(
        "/api/auth/login",
        {
          email,
          password,
        },
        {
          withCredentials: true, // 쿠키 전송을 위해 필요
        }
      );

      // 로그인 성공
      const { user } = response.data;
      onLogin(user.displayName || user.email);
      onClose();
    } catch (err: unknown) {
      // 오류 처리
      console.error("로그인 오류:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // 팝업 창 크기 및 위치 설정
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popupOptions = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;

    // 소셜 로그인 URL
    const url = `/auth/${provider}`;

    // 팝업 창 열기
    const popup = window.open(url, `${provider}Login`, popupOptions);

    // 팝업 창 닫힘 확인
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        // 로그인 상태 다시 확인
        fetch("/api/auth/status", {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated && data.user) {
              console.log("소셜 로그인 성공:", data.user);
              onLogin(data.user.displayName || data.user.email);
              onClose();
            }
          })
          .catch((err) => {
            console.error("로그인 상태 확인 오류:", err);
          });
      }
    }, 1000);
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

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

      {/* 소셜 로그인 섹션 */}
      <div className="mt-6">
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

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            onClick={() => handleSocialLogin("google")}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Google G 아이콘 */}
              <path
                d="M12.2461 12C12.2461 11.4477 12.6939 11 13.2461 11H20.9998C21.5521 11 21.9998 11.4477 21.9998 12C21.9998 12.5523 21.5521 13 20.9998 13H13.2461C12.6939 13 12.2461 12.5523 12.2461 12Z"
                fill="#5F6368"
              />
              <path
                d="M13.2461 18C12.6939 18 12.2461 17.5523 12.2461 17C12.2461 16.4477 12.6939 16 13.2461 16H20.9998C21.5521 16 21.9998 16.4477 21.9998 17C21.9998 17.5523 21.5521 18 20.9998 18H13.2461Z"
                fill="#5F6368"
              />
              <path
                d="M5.49976 18C3.01449 18 0.999756 15.9853 0.999756 13.5C0.999756 11.0147 3.01449 9 5.49976 9C7.52237 9 9.22625 10.3146 9.84878 12.1542C9.89088 12.2721 9.91226 12.3979 9.91226 12.5244V13.5H11.9998C12.552 13.5 12.9998 13.9477 12.9998 14.5C12.9998 15.0523 12.552 15.5 11.9998 15.5H5.49976C4.94747 15.5 4.49976 15.0523 4.49976 14.5C4.49976 13.9477 4.94747 13.5 5.49976 13.5H7.91024C7.6838 12.6093 6.967 11.9044 6.07333 11.6399C5.75634 11.5476 5.49976 11.2679 5.49976 10.9375C5.49976 10.6071 5.75634 10.3274 6.07333 10.2351C7.33308 9.83811 8.27724 8.72618 8.45618 7.36203C8.49878 7.08708 8.73437 6.87616 9.01203 6.86431C9.28969 6.85247 9.5408 7.04187 9.60389 7.3148C9.8597 8.4033 10.5491 9.33727 11.5053 9.90592C11.7547 10.0602 11.8773 10.3678 11.8053 10.6629C11.7332 10.958 11.4836 11.1751 11.1801 11.2061C10.0586 11.3183 9.06997 11.8598 8.41226 12.6638C8.59271 13.3333 9.19878 13.8469 9.91226 13.9611V12.5244C9.91226 12.3979 9.89088 12.2721 9.84878 12.1542C9.22625 10.3146 7.52237 9 5.49976 9Z"
                fill="#5F6368"
              />
            </svg>
            <span className="ml-2">Google</span>
          </button>

          <button
            onClick={() => handleSocialLogin("kakao")}
            className="w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm bg-[#FEE500] text-sm font-medium text-[#3A1D1D] hover:bg-[#F6DC00]"
          >
            <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">
              {/* Kakao 아이콘 */}
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 4C7.58172 4 4 6.95219 4 10.5C4 12.7105 5.41515 14.6668 7.5 15.7842V19.5C7.5 19.6881 7.59272 19.8613 7.74545 19.9472C7.89818 20.033 8.08727 20.0223 8.23178 19.9202L12.4318 17.2592C12.6208 17.2863 12.8135 17.3 13.0098 17.3C17.428 17.3 21.0098 14.3478 21.0098 10.8C21.0098 7.25219 17.4183 4.3 13 4.3C12.9999 4.3 12.9999 4 12 4Z"
                fill="#3A1D1D"
              />
            </svg>
            <span className="ml-2">Kakao</span>
          </button>

          <button
            onClick={() => handleSocialLogin("line")}
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
