import React, { useState, useEffect } from 'react';
import { getTestimonials } from '../../api/content';

interface Testimonial {
  id: string;
  name: string;
  position: string;
  company: string;
  imageUrl: string;
  description: string;
  career: string;
  isActive: boolean;
}

const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await getTestimonials();
        setTestimonials(data.filter((item: Testimonial) => item.isActive));
      } catch (error) {
        console.error('인물 정보를 불러오는데 실패했습니다:', error);
      }
    };
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">인물 소개</h2>
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
              <div className="p-8 md:w-2/3">
                <h3 className="text-2xl font-bold mb-2">{currentTestimonial.name}</h3>
                <p className="text-gray-600 mb-4">
                  {currentTestimonial.position} | {currentTestimonial.company}
                </p>
                <p className="text-gray-700 mb-6">{currentTestimonial.description}</p>
                <div className="text-sm text-gray-500">
                  <p>{currentTestimonial.career}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-8 space-x-4">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 