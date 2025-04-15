import React from 'react';
import { usePopup } from '../hooks/usePopup';

const EventPopupModal: React.FC = () => {
  const {
    currentPopup,
    isOpen,
    handleClose,
    handleDontShowToday,
    handleNext
  } = usePopup();

  if (!isOpen || !currentPopup) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="fixed inset-0 bg-[#00000050]" onClick={handleClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-[400px] h-[600px] flex flex-col">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <img
            src={currentPopup.imageUrl}
            alt={currentPopup.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <button
            onClick={handleDontShowToday}
            className="text-xs text-gray-500 hover:text-gray-700 bg-[#ffffff] bg-opacity-80 px-3 py-1 rounded"
          >
            오늘 하루 보지 않기
          </button>
        </div>

        {currentPopup.link && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleNext}
              className="bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPopupModal; 