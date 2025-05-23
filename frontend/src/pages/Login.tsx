import { useNavigate } from "react-router-dom";
import LoginForm from "../components/login/LoginForm";

const Login = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (_username: string) => {
    navigate("/");
  };

  return (
    <div className="flex h-full justify-center items-center p-30">
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
        <LoginForm
          onLogin={handleLoginSuccess}
          onClose={() => navigate("/")}
          socialOnly={false}
        />
      </div>
    </div>
  );
};

export default Login;
