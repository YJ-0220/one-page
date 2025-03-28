const ServicesSection = () => {
  return (
    <section id="services" className="w-full py-20 bg-gray-50 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-10 text-center">주요 서비스</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="bg-blue-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4">웹사이트 개발</h3>
            <p className="text-gray-600 text-lg">
              반응형 웹 디자인으로 모든 디바이스에서 최적의 경험을 제공합니다.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="bg-green-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4">모바일 앱</h3>
            <p className="text-gray-600 text-lg">
              네이티브 및 크로스 플랫폼 모바일 애플리케이션 개발 서비스를 제공합니다.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="bg-purple-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4">성능 최적화</h3>
            <p className="text-gray-600 text-lg">
              웹사이트 속도 및 성능 최적화로 사용자 경험을 향상시킵니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection; 