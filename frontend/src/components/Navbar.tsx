import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const Navbar = ({ activePage, setActivePage }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'home', name: '홈' },
    { id: 'about', name: '소개' },
    { id: 'services', name: '서비스' },
    { id: 'contact', name: '연락처' }
  ];

  const scrollToSection = (sectionId: string) => {
    setActivePage(sectionId);
    
    // 현재 로그인 페이지에 있다면 홈페이지로 이동
    if (location.pathname !== "/") {
      navigate("/");
      // 홈페이지로 이동 후 스크롤이 필요할 경우 약간의 지연을 줌
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    
    // 이미 홈페이지에 있으면 바로 스크롤
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="hidden md:flex items-center">
      <div className="flex gap-10">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`text-lg font-medium px-4 py-2 ${
              activePage === item.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navbar; 