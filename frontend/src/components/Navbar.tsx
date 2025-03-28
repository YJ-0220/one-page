interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const Navbar = ({ activePage, setActivePage }: NavbarProps) => {
  const navItems = [
    { id: 'home', name: '홈' },
    { id: 'about', name: '소개' },
    { id: 'services', name: '서비스' },
    { id: 'contact', name: '연락처' }
  ];

  const scrollToSection = (sectionId: string) => {
    setActivePage(sectionId);
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