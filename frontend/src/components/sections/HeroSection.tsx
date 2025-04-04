import { useState, useEffect } from "react";

const HeroSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // 배경 이미지 URL 배열
  const backgroundImages = [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1920",
    "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?q=80&w=1920",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1920",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1920",
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
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
        style={{
          backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
        }}
      />

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black opacity-60"></div>

      {/* 콘텐츠 */}
      <div className="relative z-30 text-white max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">
          환영합니다! 코리아 레볼루션입니다
        </h2>
        <p className="text-2xl mb-10">
          코리아 웹솔루션과 함께 비즈니스의 디지털 전환을 시작하세요.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
