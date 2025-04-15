import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import LogoIcon from "@/assets/faviconImg.png";
import Navbar from "@/components/Navbar";

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage, isAdmin }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

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
            {user ? (
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
                  onClick={handleLogout}
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
    </header>
  );
};

export default Header;
