import { useState, useEffect } from 'react';

interface HeroSectionProps {
  username: string;
}

const HeroSection = ({ username }: HeroSectionProps) => {
  const isVisitor = username === '방문자';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  
  // 배경 이미지 URL 배열
  const backgroundImages = [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1920',
    'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?q=80&w=1920',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1920',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1920'
  ];

  // 이미지 페이드 아웃 효과 및 순환 처리
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeOut(true);
      
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
        );
        setFadeOut(false);
      }, 1000); // 페이드 아웃 애니메이션 시간
      
    }, 5000); // 이미지 변경 간격
    
    return () => clearInterval(interval);
  }, [backgroundImages.length]);
  
  return (
    <section 
      id="home" 
      className="relative overflow-hidden h-screen w-full flex flex-col justify-center items-center"
    >
      {/* 배경 이미지 */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${backgroundImages[currentImageIndex]})` }}
      />
      
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black opacity-60"></div>
      
      {/* 콘텐츠 */}
      <div className="relative z-30 text-white max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-5xl font-bold mb-6">
          {isVisitor ? '코리아 웹솔루션에 오신 것을 환영합니다!' : `환영합니다, ${username}님!`}
        </h2>
        <p className="text-2xl mb-10">
          코리아 웹솔루션과 함께 비즈니스의 디지털 전환을 시작하세요.
        </p>
        <div className="flex justify-center">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-md font-medium hover:bg-blue-700 transition-colors text-lg">
            자세히 알아보기
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 