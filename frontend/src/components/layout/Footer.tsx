const Footer = () => {
  return (
    <footer className="bg-white mt-auto py-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} 코리아 웹솔루션. 모든 권리 보유.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex justify-center md:justify-end space-x-6">
              <a href="" className="text-gray-400 hover:text-gray-600">
                개인정보처리방침
              </a>
              <a href="" className="text-gray-400 hover:text-gray-600">
                이용약관
              </a>
              <a href="" className="text-gray-400 hover:text-gray-600">
                사이트맵
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
