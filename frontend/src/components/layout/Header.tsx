import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import EditProfileForm from "@/components/EditProfileForm";
import LogoIcon from "@/assets/faviconImg.png";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  username: string | null;
  userId: string | null;
  isAdmin: boolean;
  onLogin: (username: string) => Promise<void> | void;
  onLogout: () => void;
  email: string | null;
  photoURL: string | null;
}

const Header = ({
  activePage,
  setActivePage,
  username,
  userId,
  isAdmin,
  onLogin,
  onLogout,
  email,
  photoURL,
}: HeaderProps) => {
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const navigate = useNavigate();

  const displayName = username || email || '사용자';

  return (
    <header className="bg-[#ffffffd0] shadow-sm fixed top-0 left-0 right-0 z-50 w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div
            className="flex justify-start lg:w-0 lg:flex-1 cursor-pointer"
            onClick={() => {
              setActivePage("home");
              navigate("/");
            }}
          >
            <h1 className="w-10 h-10 text-3xl font-bold text-gray-900">
              <img src={LogoIcon} alt="로고" />
            </h1>
          </div>
          <div className="flex-grow flex justify-center">
            <Navbar activePage={activePage} setActivePage={setActivePage} />
          </div>
          <div className="flex items-center justify-end flex-shrink-0 ml-4">
            {username ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setActivePage("admin");
                      navigate("/admin");
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    관리자
                  </button>
                )}
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  회원정보
                </button>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 회원정보 수정 모달 */}
      {showEditProfileModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowEditProfileModal(false)}
            ></div>

            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-md sm:w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  회원정보 수정
                </h3>
              </div>
              <div className="p-6">
                <EditProfileForm
                  onClose={() => setShowEditProfileModal(false)}
                  userId={userId}
                  username={username}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
