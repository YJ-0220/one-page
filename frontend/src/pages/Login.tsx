import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import LoginModal from "../components/LoginModal";

const Login = () => {
  const navigate = useNavigate();
  const [showSocialModal, setShowSocialModal] = useState(false);

  const handleLoginSuccess = (_username: string) => {
    navigate("/");
  };

  const openSocialLoginModal = () => {
    setShowSocialModal(true);
  };

  // 소셜 로그인 버튼이 누르면 모달 표시
  const handleSocialLoginClick = () => {
    openSocialLoginModal();
  };

  return (
    <div className="flex justify-center items-center p-8">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
        <LoginForm
          onLogin={handleLoginSuccess}
          onClose={() => navigate("/")}
          modalMode={false}
          socialOnly={false}
          onSocialLoginClick={handleSocialLoginClick}
        />
      </div>

      {/* 소셜 로그인 모달 */}
      <LoginModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        onLogin={handleLoginSuccess}
      />
    </div>
  );
};

export default Login;
