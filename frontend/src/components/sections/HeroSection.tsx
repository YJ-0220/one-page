import React, { useState, useEffect } from 'react';
import { getImageSlides } from '../../api/content';

interface ImageSlide {
  id: string;
  imageUrl: string;
  title: string;
  isActive: boolean;
}

const HeroSection: React.FC = () => {
  const [backgroundImages, setBackgroundImages] = useState<ImageSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getImageSlides();
        setBackgroundImages(data.filter((img: ImageSlide) => img.isActive));
      } catch (error) {
        console.error('이미지를 불러오는데 실패했습니다:', error);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (backgroundImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === backgroundImages.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [backgroundImages.length]);

  if (backgroundImages.length === 0) return null;

  return (
    <section className="relative h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundImages[currentIndex].imageUrl})` }}
      />
      <div className="absolute inset-0 bg-[#00000050]" />
      <div className="relative h-full flex items-center justify-center text-center text-white">
        <div className="max-w-3xl px-4">
          <h1 className="text-5xl font-bold mb-8">최고의 서비스를 제공합니다</h1>
          <p className="text-xl mb-8">최고의 서비스를 제공합니다</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
