const AboutSection = () => {
  return (
    <section id="about" className="w-full py-20 bg-white relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-10 text-center">회사 소개</h2>
        <p className="text-lg mb-6 max-w-4xl mx-auto">저희 회사는 혁신적인 웹 솔루션을 제공하는 기업입니다.</p>
        <p className="text-lg mb-10 max-w-4xl mx-auto">2010년 설립 이후, 다양한 산업 분야의 클라이언트들에게 최고의 서비스를 제공해왔습니다.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <div className="border p-8 rounded-lg shadow-md">
            <h3 className="font-bold text-xl mb-4">미션</h3>
            <p className="text-lg">기술을 통해 사람들의 삶을 개선하는 것</p>
          </div>
          <div className="border p-8 rounded-lg shadow-md">
            <h3 className="font-bold text-xl mb-4">비전</h3>
            <p className="text-lg">디지털 혁신의 선두주자가 되는 것</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
