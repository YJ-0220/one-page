import React, { useState, useEffect } from 'react';
import { getTestimonials } from '../../api/content';

interface Testimonial {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  description: string;
  career: string;
  isActive: boolean;
}

const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await getTestimonials();
        const activeTestimonials = data.filter((testimonial: Testimonial) => testimonial.isActive);
        setTestimonials(activeTestimonials);
      } catch (error) {
        console.error('인물 소개 데이터를 불러오는데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">인물 소개</h2>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <img
                  src={currentTestimonial.imageUrl}
                  alt={currentTestimonial.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:w-2/3 p-8">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">{currentTestimonial.name}</h3>
                  <p className="text-gray-600">{currentTestimonial.position}</p>
                </div>
                <p className="text-gray-700 mb-6">{currentTestimonial.description}</p>
                <div className="text-sm text-gray-500">
                  {currentTestimonial.career}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-8 space-x-4">
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 