import { useState } from 'react';

import IntroducImg from '@/assets/introduceImg.png';
import IntroducImg2 from '@/assets/introduceImg2.png';

const TestimonialsSection = () => {
  // 인물 정보 배열
  const people = [
    {
      id: 1,
      name: '테슬라',
      position: '대표이사',
      company: 'ABC 기업',
      image: IntroducImg,
      description: '코리아 웹솔루션과 함께 진행한 프로젝트는 매우 성공적이었습니다. 전문적인 팀과 원활한 소통으로 기대 이상의 결과물을 얻었습니다.',
      career: [
        '前 XYZ 회사 CTO',
        '서울대학교 컴퓨터공학과 졸업',
        '클라우드 아키텍처 전문가',
        '10년+ 웹 개발 경력'
      ]
    },
    {
      id: 2,
      name: '소팽',
      position: '마케팅 매니저',
      company: 'XYZ 회사',
      image: IntroducImg2,
      description: '웹사이트 리뉴얼 후 트래픽이 40% 증가했으며, 고객 참여도도 크게 향상되었습니다. 항상 신속하고 친절한 서포트에 감사드립니다.',
      career: [
        '前 ABC 마케팅 책임자',
        '연세대학교 경영학과 졸업',
        '디지털 마케팅 전문가',
        '7년+ 마케팅 경력'
      ]
    },
  ];

  // 현재 표시되는 슬라이드 인덱스
  const [currentIndex, setCurrentIndex] = useState(0);

  // 이전 슬라이드로 이동
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? people.length - 1 : prevIndex - 1
    );
  };

  // 다음 슬라이드로 이동
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === people.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <section className="w-full py-20 bg-white relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-10 text-center">인물 소개</h2>
        
        <div className="relative">
          {/* 슬라이드 컨테이너 */}
          <div className="overflow-hidden rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row bg-white">
              {/* 왼쪽 이미지 영역 */}
              <div className="w-full md:w-1/2">
                <img 
                  src={people[currentIndex].image} 
                  alt={people[currentIndex].name} 
                  className="w-full h-full object-cover"
                  style={{ minHeight: '400px' }}
                />
              </div>
              
              {/* 오른쪽 텍스트 영역 */}
              <div className="w-full md:w-1/2 p-8">
                <h3 className="text-2xl font-bold mb-2">{people[currentIndex].name}</h3>
                <p className="text-lg text-blue-600 mb-4">{people[currentIndex].position}, {people[currentIndex].company}</p>
                
                <p className="text-gray-700 text-lg mb-6 italic">
                  "{people[currentIndex].description}"
                </p>
                
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">주요 경력</h4>
                  <ul className="space-y-2">
                    {people[currentIndex].career.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* 이전/다음 버튼 */}
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            onClick={prevSlide}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            onClick={nextSlide}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* 인디케이터 점 */}
        <div className="flex justify-center space-x-2 mt-6">
          {people.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 