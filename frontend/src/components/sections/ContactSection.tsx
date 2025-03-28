const ContactSection = () => {
  return (
    <section id="contact" className="w-full py-20 bg-white relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-10 text-center">연락처</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="font-bold text-2xl mb-6">오시는 길</h3>
            <div className="space-y-4 text-lg">
              <p>서울특별시 강남구 테헤란로 123</p>
              <p>전화: 02-123-4567</p>
              <p>이메일: info@example.com</p>
            </div>
          </div>
          <div className="h-128 bg-gray-200 rounded-lg">
            {/* 여기에 지도가 들어갈 수 있습니다 */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
